# The Recap Cutter

Cuts a 30 to 40 second recap from a session's recording, using a plan made in the Anexanum
(The videos, Recap video). For Nate's machine only.

## Once, on Windows

Open PowerShell and run:

    winget install Python.Python.3.12
    winget install Gyan.FFmpeg

Close and reopen PowerShell afterwards so both are found.

## Each time

1. In the Anexanum, open The videos, press Recap video on the session, check the clips, and
   Download the plan.
2. Download the session's recording from Restream (within the week, before Restream deletes
   it), or from YouTube Studio.
3. Double-click **Recap Cutter.bat**, choose the plan and the recording, and press **Cut the
   recap**.

Two files appear beside the recording: `... recap.mp4` (16:9) and `... recap vertical.mp4`
(9:16, for TikTok and Shorts). If every clip starts a little early or late (Restream's
recording and YouTube's video can start a few seconds apart), set **Move every clip by** to
that many seconds (negative for earlier) and cut again.
