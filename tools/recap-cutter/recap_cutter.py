"""
The Recap Cutter, for Nate's own machine (Windows).

Takes a session's recording (the MP4 from Restream, or downloaded from YouTube Studio) and a
recap plan from the Anexanum, and cuts the planned clips into one short recap, with a quick
fade at each cut. It writes two files beside the recording:

    <recording> recap.mp4            16:9, as the recording is
    <recording> recap vertical.mp4   9:16, for TikTok and Shorts (the picture centred over a
                                     blurred fill of itself)

Needs Python 3 and ffmpeg (see README.md). Run "Recap Cutter.bat", or from a terminal:
    python recap_cutter.py                       (opens the window)
    python recap_cutter.py PLAN.json VIDEO.mp4   (no window; add --shift 2.5 to move every clip)
"""
import json, os, shutil, subprocess, sys, tempfile, threading, glob

FADE_V = 0.15   # seconds of fade at each end of a clip
FADE_A = 0.12


def find_ffmpeg():
    """ffmpeg on the PATH, or where winget puts it."""
    exe = shutil.which('ffmpeg')
    if exe:
        return exe, shutil.which('ffprobe') or exe.replace('ffmpeg', 'ffprobe')
    local = os.environ.get('LOCALAPPDATA', '')
    for pat in [os.path.join(local, 'Microsoft', 'WinGet', 'Packages', '*FFmpeg*', '*', 'bin', 'ffmpeg.exe'),
                r'C:\ffmpeg\bin\ffmpeg.exe', r'C:\Program Files\ffmpeg\bin\ffmpeg.exe']:
        hits = glob.glob(pat)
        if hits:
            return hits[0], hits[0].replace('ffmpeg.exe', 'ffprobe.exe')
    return None, None


def run(cmd, log):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if p.returncode != 0:
        tail = '\n'.join(p.stdout.strip().splitlines()[-8:])
        raise RuntimeError('ffmpeg stopped:\n' + tail)


def cut(plan_path, video_path, shift=0.0, log=print, vertical=True):
    ffmpeg, _ = find_ffmpeg()
    if not ffmpeg:
        raise RuntimeError('ffmpeg is not installed. See README.md: winget install Gyan.FFmpeg')
    with open(plan_path, encoding='utf-8') as f:
        plan = json.load(f)
    if plan.get('kind') != 'lorefell-recap-plan':
        raise RuntimeError('That file is not a recap plan from the Anexanum.')
    clips = sorted(plan.get('clips') or [], key=lambda c: c['start'])
    if not clips:
        raise RuntimeError('The plan has no clips.')
    base = os.path.splitext(video_path)[0]
    out16 = base + ' recap.mp4'
    out9 = base + ' recap vertical.mp4'
    work = tempfile.mkdtemp(prefix='recap-')
    parts = []
    try:
        for i, c in enumerate(clips):
            start = max(0.0, float(c['start']) + shift)
            dur = max(0.5, float(c['end']) - float(c['start']))
            out = os.path.join(work, 'clip%02d.mp4' % i)
            log('Clip %d of %d: %s (%.1fs)' % (i + 1, len(clips), c.get('label') or '', dur))
            vf = ('scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,'
                  'fade=t=in:st=0:d=%.2f,fade=t=out:st=%.2f:d=%.2f' % (FADE_V, max(0, dur - FADE_V), FADE_V))
            af = 'aresample=48000,afade=t=in:st=0:d=%.2f,afade=t=out:st=%.2f:d=%.2f' % (FADE_A, max(0, dur - FADE_A), FADE_A)
            # seek before the input (fast), then cut exactly by re-encoding the few seconds
            run([ffmpeg, '-y', '-ss', '%.2f' % start, '-i', video_path, '-t', '%.2f' % dur,
                 '-vf', vf, '-af', af, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                 '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-movflags', '+faststart', out], log)
            parts.append(out)
        lst = os.path.join(work, 'list.txt')
        with open(lst, 'w', encoding='utf-8') as f:
            for p in parts:
                f.write("file '%s'\n" % p.replace('\\', '/').replace("'", "'\\''"))
        log('Joining the clips…')
        run([ffmpeg, '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', out16], log)
        if vertical:
            log('Making the vertical version…')
            fc = ('[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2[bg];'
                  '[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]')
            run([ffmpeg, '-y', '-i', out16, '-filter_complex', fc, '-map', '[v]', '-map', '0:a?',
                 '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'copy', '-movflags', '+faststart', out9], log)
        total = sum(max(0.5, float(c['end']) - float(c['start'])) for c in clips)
        log('Done: %d clips, about %d seconds.\n%s%s' % (len(clips), round(total), out16, ('\n' + out9) if vertical else ''))
        return out16, (out9 if vertical else None)
    finally:
        shutil.rmtree(work, ignore_errors=True)


def window():
    import tkinter as tk
    from tkinter import filedialog, ttk
    root = tk.Tk()
    root.title('The Recap Cutter')
    root.geometry('640x460')
    root.configure(bg='#0d1222')
    st = {'plan': '', 'video': ''}
    style = ttk.Style(root)
    try:
        style.theme_use('clam')
    except Exception:
        pass
    style.configure('TLabel', background='#0d1222', foreground='#e9e2cf', font=('Georgia', 11))
    style.configure('TButton', font=('Georgia', 11))
    style.configure('TCheckbutton', background='#0d1222', foreground='#e9e2cf', font=('Georgia', 11))
    pad = {'padx': 14, 'pady': 6, 'sticky': 'w'}
    ttk.Label(root, text='The Recap Cutter', font=('Georgia', 18, 'bold'), foreground='#c9a84c').grid(row=0, column=0, columnspan=2, **pad)
    lp = ttk.Label(root, text='No plan chosen'); lv = ttk.Label(root, text='No recording chosen')

    def pick_plan():
        p = filedialog.askopenfilename(title='The recap plan', filetypes=[('Recap plan', '*.json')])
        if p:
            st['plan'] = p; lp.config(text=os.path.basename(p))

    def pick_video():
        p = filedialog.askopenfilename(title="The session's recording", filetypes=[('Video', '*.mp4 *.mov *.mkv')])
        if p:
            st['video'] = p; lv.config(text=os.path.basename(p))
    ttk.Button(root, text='Choose the plan', command=pick_plan).grid(row=1, column=0, **pad); lp.grid(row=1, column=1, **pad)
    ttk.Button(root, text='Choose the recording', command=pick_video).grid(row=2, column=0, **pad); lv.grid(row=2, column=1, **pad)
    ttk.Label(root, text='Move every clip by (seconds)').grid(row=3, column=0, **pad)
    shift = tk.StringVar(value='0'); tk.Entry(root, textvariable=shift, width=8).grid(row=3, column=1, **pad)
    vert = tk.BooleanVar(value=True); ttk.Checkbutton(root, text='Also make the vertical version', variable=vert).grid(row=4, column=0, columnspan=2, **pad)
    out = tk.Text(root, height=10, width=74, bg='#131a2e', fg='#e9e2cf', relief='flat', font=('Consolas', 10))
    out.grid(row=6, column=0, columnspan=2, padx=14, pady=8)

    def log(t):
        root.after(0, lambda: (out.insert('end', t + '\n'), out.see('end')))

    def go():
        if not st['plan'] or not st['video']:
            log('Choose the plan and the recording first.'); return
        try:
            s = float(shift.get() or 0)
        except ValueError:
            log('The move has to be a number of seconds, like 2 or -1.5.'); return
        btn.config(state='disabled')

        def work():
            try:
                cut(st['plan'], st['video'], s, log, vert.get())
            except Exception as e:
                log(str(e))
            finally:
                root.after(0, lambda: btn.config(state='normal'))
        threading.Thread(target=work, daemon=True).start()
    btn = ttk.Button(root, text='Cut the recap', command=go)
    btn.grid(row=5, column=0, **pad)
    root.mainloop()


if __name__ == '__main__':
    args = [a for a in sys.argv[1:]]
    if len(args) >= 2 and not args[0].startswith('--'):
        sh = 0.0
        if '--shift' in args:
            sh = float(args[args.index('--shift') + 1])
        cut(args[0], args[1], sh)
    else:
        window()
