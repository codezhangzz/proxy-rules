// FlClash 扩展脚本（备选版 v2）：按国家/地区分组，组内提供「自动」和「优先」两种模式
//
// 与 flclash-country-groups.js 的区别：
//   每个国家组里除了「♻️ XX自动」(url-test，选延迟最低)，还多了一个
//   「📌 XX优先」(fallback)：按 PREFERRED 里的节点顺序优先使用，
//   首选节点挂了才换同国下一个，恢复后自动切回；不会因为别的节点更快就跳。
//
// 用法：
//   配置 → 点开要用的订阅 → 编辑 → 扩展模式选「脚本模式」
//   → 粘贴本文件全部内容 → 保存 → 应用配置
//
// 其它行为与 v1 相同：
//   * 不写死节点名，按名称里的国旗 emoji、中英文国家名、ISO 代码归类。
//   * 订阅自带的「自动选择」「故障转移」原样保留，统一排在列表最后。
//   * 公告/流量信息节点不进入脚本生成的任何分组。
//   * 自定义规则集中在「自定义配置区」，排在订阅规则前面；直连、指定节点、指定代理组都有示例。

function main(config) {
  var TEST_URL = 'https://www.gstatic.com/generate_204';
  var INTERVAL = 180;

  // 想指定每个国家优先用哪些节点：数组顺序就是优先级，没写到的排在后面。
  // key 用国家简称（与分组名去掉国旗后一致），例如：
  //   '香港': ['香港HKT|动态家宽1', '香港HKT三网|商宽1'],
  //   '美国': ['美·洛杉矶|专线-DS2']
  var PREFERRED = {};

  // 机场塞在节点列表里的公告/流量信息节点，不参与分组
  var SKIP = /剩余流量|套餐|到期|重置|订阅|超时请|官网|客服/;

  var proxies = (config && config.proxies) || [];
  var names = [];
  for (var i = 0; i < proxies.length; i++) {
    var n = proxies[i] && proxies[i].name;
    if (typeof n !== 'string' || !n) continue;
    if (SKIP.test(n)) continue;
    names.push(n);
  }
  if (names.length === 0) return config;

  var groups = (config['proxy-groups'] || []).slice();
  // 订阅原始规则另存一份，只用来识别规则指向的入口组，免得自定义规则干扰判断
  var profileRules = (config.rules || []).slice();

  var regions = [
    { name: '🇭🇰 香港', pattern: '🇭🇰|香港|hong\\s?kong|\\bhk\\b|\\bhkg\\b' },
    { name: '🇹🇼 台湾', pattern: '🇹🇼|台湾|台灣|taiwan|\\btw\\b|\\btwn\\b' },
    { name: '🇰🇷 韩国', pattern: '🇰🇷|韩国|韓國|韩|korea|\\bkr\\b|\\bkor\\b|首尔|首爾' },
    { name: '🇺🇸 美国', pattern: '🇺🇸|美国|美國|united\\s?states|\\bus\\b|\\busa\\b|洛杉矶|洛杉磯|圣何塞|聖何塞|西雅图|西雅圖|纽约|紐約|芝加哥|达拉斯|凤凰城|鳳凰城|盐湖城|鹽湖城|硅谷|矽谷' },
    { name: '🇯🇵 日本', pattern: '🇯🇵|日本|japan|\\bjp\\b|\\bjpn\\b|东京|東京|大阪|埼玉|樱花|櫻花|软银|軟銀' },
    { name: '🇸🇬 新加坡', pattern: '🇸🇬|新加坡|singapore|\\bsg\\b|\\bsgp\\b|狮城|獅城' },
    { name: '🇲🇴 澳门', pattern: '🇲🇴|澳门|澳門|macau|macao|\\bmo\\b' },
    { name: '🇹🇭 泰国', pattern: '🇹🇭|泰国|泰國|thailand|\\bth\\b|曼谷' },
    { name: '🇩🇪 德国', pattern: '🇩🇪|德国|德國|germany|\\bde\\b|法兰克福|法蘭克福' },
    { name: '🇫🇷 法国', pattern: '🇫🇷|法国|法國|france|\\bfr\\b|巴黎' },
    { name: '🇳🇱 荷兰', pattern: '🇳🇱|荷兰|荷蘭|netherlands|\\bnl\\b|阿姆斯特丹' },
    { name: '🇬🇧 英国', pattern: '🇬🇧|英国|英國|united\\s?kingdom|\\buk\\b|\\bgb\\b|伦敦|倫敦' },
    { name: '🇲🇾 马来西亚', pattern: '🇲🇾|马来西亚|馬來西亞|malaysia|\\bmy\\b|吉隆坡' },
    { name: '🇵🇭 菲律宾', pattern: '🇵🇭|菲律宾|菲律賓|philippines|\\bph\\b|马尼拉|馬尼拉' },
    { name: '🇻🇳 越南', pattern: '🇻🇳|越南|vietnam|\\bvn\\b|胡志明' },
    { name: '🇮🇩 印尼', pattern: '🇮🇩|印度尼西亚|印度尼西亞|印尼|indonesia|\\bid\\b|雅加达|雅加達' },
    { name: '🇮🇳 印度', pattern: '🇮🇳|印度(?!尼西亚|尼西亞)|india|孟买|孟買' },
    { name: '🇦🇺 澳大利亚', pattern: '🇦🇺|澳大利亚|澳洲|australia|\\bau\\b|悉尼|雪梨|墨尔本|墨爾本' },
    { name: '🇨🇦 加拿大', pattern: '🇨🇦|加拿大|canada|\\bca\\b|多伦多|多倫多|温哥华|溫哥華' },
    { name: '🇷🇺 俄罗斯', pattern: '🇷🇺|俄罗斯|俄羅斯|russia|\\bru\\b|莫斯科' },
    { name: '🇹🇷 土耳其', pattern: '🇹🇷|土耳其|turkey|\\btr\\b|伊斯坦布尔' },
    { name: '🇦🇪 阿联酋', pattern: '🇦🇪|阿联酋|阿聯酋|迪拜|emirates|\\bae\\b' },
    { name: '🇧🇷 巴西', pattern: '🇧🇷|巴西|brazil|\\bbr\\b' },
    { name: '🇦🇷 阿根廷', pattern: '🇦🇷|阿根廷|argentina|\\bar\\b' }
  ];

  var compiled = [];
  for (var r = 0; r < regions.length; r++) {
    compiled.push(new RegExp(regions[r].pattern, 'i'));
  }

  var buckets = [];
  var others = [];
  for (var b = 0; b < regions.length; b++) buckets.push([]);
  for (var k = 0; k < names.length; k++) {
    var hit = -1;
    for (var c = 0; c < compiled.length; c++) {
      if (compiled[c].test(names[k])) { hit = c; break; }
    }
    if (hit >= 0) buckets[hit].push(names[k]);
    else others.push(names[k]);
  }

  // ================= 自定义配置区（以后只改这一段）=================
  // 1) 普通规则：按顺序插在订阅规则前面，所以优先命中。
  //    目标可以写 DIRECT / REJECT、某个节点全名、或某个代理组名。
  //    示例默认注释掉，去掉行首的 // 才生效。
  var MY_RULES = [
    // —— 当前在用的 ——
    // 'DOMAIN-SUFFIX,bing.com,DIRECT',

    // —— 直连 ——
    // 'DOMAIN-SUFFIX,example.com,DIRECT',
    // 'DOMAIN,foo.example.net,DIRECT',
    // 'DOMAIN-KEYWORD,ads,DIRECT',
    // 'IP-CIDR,192.168.50.0/24,DIRECT,no-resolve',

    // —— 走指定节点：写节点全名，机场改名后就失效，慎用 ——
    // 'DOMAIN-SUFFIX,example.org,香港HKT|动态家宽1',

    // —— 走指定代理组：组名要和实际建出来的一致 ——
    // 'DOMAIN-SUFFIX,openai.com,🇺🇸 美国',     // 脚本按国家建的组
    // 'DOMAIN-SUFFIX,netflix.com,📌 美国优先',   // 该国家的「优先」组
    // 'DOMAIN-SUFFIX,github.com,♻️ 自动选择',    // 订阅自带「自动选择」时组名可能不同
  ];

  // 2) 引用地区组的规则：组名从 regions 表按序号取，不用手写，改名自动跟随。
  //    regions[1] = 表格第 2 项（截图里圈中的那个组）；往它前面插新地区时索引要跟着改。
  //    该地区没有节点时整组规则跳过，免得引用不存在的组导致配置校验失败。
  var myGroup = regions[1].name;
  // 该分类下的「自动」组（url-test，选延迟最低）：组名同样由 myGroup 派生，不用手写。
  // var myAutoGroup = '♻️ ' + myGroup.replace(/^\S+\s*/, '') + '自动';
  var myGroupRules = buckets[1].length > 0
    ? [
        // 'DOMAIN-SUFFIX,google.com,' + myGroup,
        // 'DOMAIN-SUFFIX,google.com.hk,' + myGroup,
        // 想走类别下的「自动选择」时，把目标换成 myAutoGroup，例如：
        // 'DOMAIN-SUFFIX,example.net,' + myAutoGroup
      ]
    : [];

  // 3) 合并顺序：MY_RULES → 地区组规则 → 订阅原规则
  var rules = MY_RULES.concat(myGroupRules, profileRules);
  config.rules = rules;
  // ================= 自定义配置区结束 =================

  var existing = {};
  for (var g0 = 0; g0 < groups.length; g0++) existing[groups[g0].name] = true;

  var AUTO = '♻️ 自动选择';
  var ALL = '🌐 全部节点';
  var OTHER = '🏳️ 其他地区';

  var buildAuto = function (name, members, hidden) {
    var group = {
      name: name,
      type: 'url-test',
      proxies: members,
      url: TEST_URL,
      interval: INTERVAL,
      tolerance: 50,
      lazy: true
    };
    if (hidden) group.hidden = true;
    return group;
  };

  var buildFallback = function (name, members) {
    return {
      name: name,
      type: 'fallback',
      proxies: members,
      url: TEST_URL,
      interval: INTERVAL,
      lazy: true,
      hidden: true
    };
  };

  // PREFERRED 里点名的节点排前面，其余保持订阅原有顺序
  var fallbackOrder = function (shortName, members) {
    var preferred = PREFERRED[shortName] || [];
    var ordered = [];
    var used = {};
    for (var p = 0; p < preferred.length; p++) {
      for (var m = 0; m < members.length; m++) {
        if (members[m] === preferred[p] && !used[members[m]]) {
          ordered.push(members[m]);
          used[members[m]] = true;
        }
      }
    }
    for (var m2 = 0; m2 < members.length; m2++) {
      if (!used[members[m2]]) ordered.push(members[m2]);
    }
    return ordered;
  };

  // 订阅里已有「自动选择」时直接引用它，原样保留，不改成员和参数；没有才创建
  var AUTO_NAMES = ['自动选择', '自动', 'auto', 'auto select', 'auto-select'];
  var autoName = null;
  for (var ag = 0; ag < groups.length; ag++) {
    if (groups[ag].type !== 'url-test') continue;
    var agName = String(groups[ag].name).replace(/^\s+|\s+$/g, '').toLowerCase();
    if (AUTO_NAMES.indexOf(agName) >= 0) { autoName = groups[ag].name; break; }
  }
  var autoGroup = null;
  if (!autoName) {
    autoName = AUTO;
    if (!existing[AUTO]) {
      autoGroup = buildAuto(AUTO, names);
      existing[AUTO] = true;
    }
  }

  // 每个国家：select 组里依次是「自动」「优先」，后面是该国全部单节点
  var regionGroups = [];
  var regionSubs = [];
  var regionNames = [];
  for (var rg = 0; rg < regions.length; rg++) {
    if (buckets[rg].length === 0) continue;
    regionNames.push(regions[rg].name);
    if (existing[regions[rg].name]) continue;
    var shortName = regions[rg].name.replace(/^\S+\s*/, '');
    var subAuto = '♻️ ' + shortName + '自动';
    var subFallback = '📌 ' + shortName + '优先';
    if (!existing[subAuto]) {
      regionSubs.push(buildAuto(subAuto, buckets[rg], true));
      existing[subAuto] = true;
    }
    if (!existing[subFallback]) {
      regionSubs.push(buildFallback(subFallback, fallbackOrder(shortName, buckets[rg])));
      existing[subFallback] = true;
    }
    regionGroups.push({
      name: regions[rg].name,
      type: 'select',
      proxies: [subAuto, subFallback].concat(buckets[rg])
    });
    existing[regions[rg].name] = true;
  }

  var otherGroup = null;
  if (others.length > 0 && !existing[OTHER]) {
    var otherShort = '其他地区';
    var otherAuto = '♻️ ' + otherShort + '自动';
    var otherFallback = '📌 ' + otherShort + '优先';
    if (!existing[otherAuto]) {
      regionSubs.push(buildAuto(otherAuto, others, true));
      existing[otherAuto] = true;
    }
    if (!existing[otherFallback]) {
      regionSubs.push(buildFallback(otherFallback, fallbackOrder(otherShort, others)));
      existing[otherFallback] = true;
    }
    otherGroup = {
      name: OTHER,
      type: 'select',
      proxies: [otherAuto, otherFallback].concat(others)
    };
    existing[OTHER] = true;
  }

  var allGroup = null;
  if (!existing[ALL]) {
    allGroup = { name: ALL, type: 'select', proxies: names };
    existing[ALL] = true;
  }

  // 找出订阅规则里指向的入口组（通常是 订阅名·Link / 主代理 之类）
  var existingNames = {};
  for (var g1 = 0; g1 < groups.length; g1++) existingNames[groups[g1].name] = true;

  var hits = {};
  for (var ri = 0; ri < profileRules.length; ri++) {
    if (typeof profileRules[ri] !== 'string') continue;
    var parts = profileRules[ri].split(',');
    for (var pi = 1; pi < parts.length; pi++) {
      var t = parts[pi].replace(/^\s+|\s+$/g, '');
      if (t && t !== 'no-resolve' && existingNames[t]) {
        hits[t] = (hits[t] || 0) + 1;
      }
    }
  }

  var mainName = null;
  var best = 0;
  for (var g2 = 0; g2 < groups.length; g2++) {
    var g = groups[g2];
    if (g.type !== 'select') continue;
    var h = hits[g.name] || 0;
    if (h > best) { best = h; mainName = g.name; }
  }
  var replaceExisting = mainName !== null;
  if (!mainName) mainName = '🚀 节点选择';

  var mainMembers = [autoName];
  for (var rn = 0; rn < regionNames.length; rn++) mainMembers.push(regionNames[rn]);
  if (others.length > 0) mainMembers.push(OTHER);
  mainMembers.push(ALL);
  mainMembers.push('DIRECT');

  var mainGroup = { name: mainName, type: 'select', proxies: mainMembers };

  // 订阅原有分组（自动选择、故障转移等）原样保留，统一排到最后
  var kept = [];
  for (var g3 = 0; g3 < groups.length; g3++) {
    if (replaceExisting && groups[g3].name === mainName) continue;
    kept.push(groups[g3]);
  }

  var built = [mainGroup];
  if (autoGroup) built.push(autoGroup);
  for (var b2 = 0; b2 < regionGroups.length; b2++) built.push(regionGroups[b2]);
  if (otherGroup) built.push(otherGroup);
  if (allGroup) built.push(allGroup);
  for (var b3 = 0; b3 < regionSubs.length; b3++) built.push(regionSubs[b3]);

  config['proxy-groups'] = built.concat(kept);

  // 订阅规则没有指向任何 select 组时，把 MATCH 指到新的入口组
  if (!replaceExisting) {
    var replaced = false;
    for (var mi = rules.length - 1; mi >= 0; mi--) {
      if (typeof rules[mi] === 'string' && /^\s*MATCH\s*,/i.test(rules[mi])) {
        rules[mi] = 'MATCH,' + mainName;
        replaced = true;
        break;
      }
    }
    if (!replaced) rules.push('MATCH,' + mainName);
    config.rules = rules;
  }

  return config;
}
