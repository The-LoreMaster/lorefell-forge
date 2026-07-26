/* Opening a different adventure from inside ThreadSpire hung on "Still here". The switch
 * rebound the campaign id in place and swapped the roster and goals, but the story spine
 * lives in the campaign's saved state, which only FateWell writes when it launches a
 * table. A rebind had nothing to load the story from, so the table opened empty and the
 * veil never lifted. Opening the same adventure from FateWell worked because FateWell
 * navigates fresh.
 *
 * The switch navigates now, the same path FateWell uses, so the whole load runs again for
 * the chosen id and brings its state and story across. This checks the decision the Velo
 * handler makes; it runs in Velo, so the table is a mirrored function, not jsdom.
 *
 *   node threadspire/tests/campaign-switch.test.js
 */
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok === true) { console.log('  PASS  ' + name); pass++; }
  else { console.log('  FAIL  ' + name + '\n          ' + detail); fail++; }
}

// A faithful copy of the TS_CAMPAIGN_SET handler's decision (velo/page-threadspire.js).
function handleCampaignSet(msg, characterId, navigate) {
  const replies = [];
  const reply = (ok, data, err) => replies.push({ ok, data, err });
  const next = String((msg && msg.campaignId) || '');
  if (!next) { reply(false, null, 'no adventure given'); return { replies, url: null }; }
  reply(true, { ok: true, campaignId: next, navigating: true });
  const cid = characterId ? ('&character=' + encodeURIComponent(characterId)) : '';
  const url = '/the-threadspire?campaign=' + encodeURIComponent(next) + '&role=lm' + cid;
  navigate(url);
  return { replies, url };
}

console.log('\nopening a chosen adventure navigates to it');

let url = null;
let r = handleCampaignSet({ campaignId: 'SnS' }, 'charX', (u) => { url = u; });
check('the switch acks ok, marked as navigating, before the page moves', r.replies[0].ok === true && r.replies[0].data.navigating === true, JSON.stringify(r.replies));
check('it navigates to the chosen adventure as LoreMaster', url === '/the-threadspire?campaign=SnS&role=lm&character=charX', url);

r = handleCampaignSet({ campaignId: 'Bea' }, '', (u) => { url = u; });
check('with no Fell in hand, the character param is left off', url === '/the-threadspire?campaign=Bea&role=lm', url);

let navigated = false;
r = handleCampaignSet({ campaignId: '' }, 'charX', () => { navigated = true; });
check('an empty adventure is refused and nothing navigates', r.replies[0].ok === false && navigated === false, JSON.stringify(r));

console.log('\n' + (fail ? 'FAILED ' + fail + ' of ' + (pass + fail) : 'all ' + pass + ' checks passed'));
process.exit(fail ? 1 : 0);
