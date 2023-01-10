import axios from 'axios';
import fs from 'fs-extra';
import configModule from 'config';
const config = configModule as any as {
  authorization: string;
  cookie: string;
  csrftoken: string;
  since: string;
  until: string;
  namelist: string[];
};

const authorization = config.authorization;
const cookie = config.cookie;
const csrftoken = config.csrftoken;

const since = config.since;
const until = config.until;
const filter = 'filter:images -filter:quote';
const namelist = config.namelist;

/** 全ツイート */
const tweets: any[] = [];

const base = 'https://twitter.com/i/api/2/search/adaptive.json';
const searchWordList = (() => {
  const list: string[] = [];
  namelist.map((name) => {
    list.push(...[`#${name}`, `#${name}生誕祭`, `#${name}生誕祭2023`, `#${name}誕生祭`, `#${name}誕生祭2023`]);
  });
  return list;
})();
let cursor = '';
const main = async () => {
  for (const searchWord of searchWordList) {
    console.log(`--------------${searchWord}--------------------------`);

    const q = encodeURIComponent(`${searchWord} ${since} ${until} ${filter}`);

    console.log('最新ツイート');
    const latest = `${base}?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_has_nft_avatar=1&include_ext_is_blue_verified=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_ext_limited_action_results=false&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_ext_collab_control=true&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&include_ext_sensitive_media_warning=true&include_ext_trusted_friends_metadata=true&send_error_codes=true&simple_quoted_tweet=true&tweet_search_mode=live&count=20&query_source=typed_query&pc=1&spelling_corrections=1&include_ext_edit_control=true&ext=mediaStats%2ChighlightedLabel%2ChasNftAvatar%2CvoiceInfo%2Cenrichments%2CsuperFollowMetadata%2CunmentionInfo%2CeditControl%2Ccollab_control%2Cvibe`;
    cursor = '';
    await search(latest, q);

    console.log('話題のツイート');
    const wadai = `${base}?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_has_nft_avatar=1&include_ext_is_blue_verified=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_ext_limited_action_results=false&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_ext_collab_control=true&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&include_ext_sensitive_media_warning=true&include_ext_trusted_friends_metadata=true&send_error_codes=true&simple_quoted_tweet=true&count=20&query_source=typed_query&pc=1&spelling_corrections=1&include_ext_edit_control=true&ext=mediaStats,highlightedLabel,hasNftAvatar,voiceInfo,birdwatchPivot,enrichments,superFollowMetadata,unmentionInfo,editControl,collab_control,vibe`;
    cursor = '';
    await search(wadai, q);
  }
};

const search = async (twitterurlbase: string, q: string) => {
  const twitterurl = `${twitterurlbase}&q=${q}${cursor}`;
  const isLiveSearch = twitterurlbase.includes('tweet_search_mode=live');

  const result = await axios.get(twitterurl, {
    headers: {
      authorization,
      cookie,
      'x-csrf-token': csrftoken,
    },
  });

  // console.log(result.data);
  const data = result.data;
  const usersTmp: any[] = data.globalObjects.users;
  const tweetTmp: any[] = (Object.values(data.globalObjects.tweets) as any[]).map((item) => {
    return {
      ...item,
      user: usersTmp[item.user_id_str],
    };
  });

  tweets.push(...tweetTmp);

  // 初回
  let cursorData = '';
  data.timeline.instructions.find((item) => {
    if (!item.addEntries) return false;
    item.addEntries.entries.map((item2) => {
      if (item2.entryId === 'sq-cursor-bottom' || item2.entryId === 'cursor-bottom-0') {
        cursorData = item2.content.operation.cursor.value;
        // console.log(cursorData);
      }
      // console.log(item2.entryId);
    });

    return false;
  });

  // 2回目以降
  if (!cursorData) {
    data.timeline.instructions.map((item) => {
      if (item.replaceEntry) {
        if (item.replaceEntry.entry.entryId === 'sq-cursor-bottom' || item.replaceEntry.entry.entryId === 'cursor-bottom-0') {
          cursorData = item.replaceEntry.entry.content.operation.cursor.value;
        }
      }
    });
  }

  fs.writeJSONSync('_out.json', tweets);
  // fs.writeJSONSync('./debug.json', data);

  if (tweetTmp.length > 0) {
    const lastTmp = tweetTmp[tweetTmp.length - 1];
    // console.log(JSON.stringify(lastTmp));
    console.log(`${tweetTmp.length}件： ${lastTmp.created_at} @${lastTmp.user.screen_name}`); //${lastTmp.full_text.replace(/\s/g, ' ').slice(0, 20)}
  } else {
    console.log('0件');
  }

  if (cursorData && tweetTmp.length > 0) {
    cursor = `&cursor=${cursorData}`;

    await search(twitterurlbase, q);
  } else {
    // console.log('終了');
  }
};

main();
