# FlClash 国家/地区分组脚本

`Clash/flclash-country-groups.js` 是 FlClash 的配置扩展脚本。它读取订阅解析后的 Clash 配置，按节点名称中的国家/地区信息重新组织代理组，并在订阅规则之前插入自定义分流规则。

## 功能

- 按国旗 emoji、中英文国家名、ISO 国家代码归类节点，不写死节点名。
- 每个有节点的国家/地区生成一个 `select` 组，组内包含该地区的「自动」「优先」和全部单节点。
- `♻️ XX自动` 使用 `url-test`，自动选择延迟最低的节点。
- `📌 XX优先` 使用 `fallback`，按 `PREFERRED` 中的顺序优先使用，节点不可用时才切换。
- 未识别地区的节点归入 `🏳️ 其他地区`，并生成 `🌐 全部节点`。
- 复用订阅规则引用最多的 `select` 组作为主入口；没有则新建 `🚀 节点选择`。
- 订阅自带的 `自动选择`、`故障转移` 等分组原样保留，排在脚本生成的分组之后。
- 流量、到期、客服等公告节点不会进入任何脚本生成的分组。
- 自定义规则整体排在订阅规则之前，优先命中。

## 使用方法

1. 打开 FlClash：`配置` → 选择要使用的订阅 → `编辑`。
2. 将 `扩展模式` 设为 `脚本模式`。
3. 粘贴 `Clash/flclash-country-groups.js` 的全部内容并保存。
4. 应用配置，在 `代理` 页面选择入口组和具体地区。

脚本通过 `main(config)` 接收配置并返回修改后的配置，FlClash 会在解析订阅后调用它。

## 生成的分组

以香港为例：

| 分组名 | 类型 | 说明 |
| --- | --- | --- |
| `🇭🇰 香港` | select | 地区入口，成员为「自动」「优先」和该国全部节点 |
| `♻️ 香港自动` | url-test | 延迟最低的香港节点（创建时隐藏） |
| `📌 香港优先` | fallback | 按 `PREFERRED` 顺序使用（创建时隐藏） |

其他固定分组：

| 分组名 | 说明 |
| --- | --- |
| `🌐 全部节点` | 全部可用节点 |
| `🏳️ 其他地区` | 未匹配到国家的节点 |
| `🤖 AI` | AI 专用入口，成员为各地区组、其他地区、关闭旁路、全部节点和 `DIRECT` |
| `♻️ 其他地区自动` / `📌 其他地区优先` | 其他地区的自动/优先组（创建时隐藏） |
| `♻️ 自动选择` | 复用或新建的全局自动组 |
| `🚀 节点选择` | 订阅没有可复用入口组时的主入口 |

主入口组的成员顺序为：自动组 → 各地区组 → 其他地区 → 全部节点 → `DIRECT`。

自动组优先复用订阅中的 `url-test` 组（名称匹配 `自动选择`、`自动`、`auto` 等，或已存在同名 `♻️ 自动选择`）；没有时用全部节点创建 `♻️ 自动选择`。

## 配置项

可调项都集中在脚本开头的「自定义配置区」及其上方。

### 测速参数

```js
var TEST_URL = 'https://www.gstatic.com/generate_204';
var INTERVAL = 180;
```

`TEST_URL` 用于 `url-test` 和 `fallback` 的健康检查，`INTERVAL` 是检查间隔（秒）。如果该地址不可用，换成自己的 204 地址。

### PREFERRED：优先节点顺序

```js
var PREFERRED = {
  '香港': ['香港HKT|动态家宽1', '香港HKT三网|商宽1'],
  '美国': ['美·洛杉矶|专线-DS2']
};
```

- key 是分组名去掉国旗后的简称，例如 `香港`、`美国`。
- 数组顺序就是优先级，只影响 `📌 XX优先`，不影响 `♻️ XX自动`。
- 节点名必须与订阅中的完整名称一致，机场改名后需要同步修改；未列出的节点排在后面。

### SKIP：排除公告节点

```js
var SKIP = /剩余流量|套餐|到期|重置|订阅|超时请|官网|客服/;
```

名称匹配该正则的节点不会进入任何脚本生成的分组，但仍保留在配置的 `proxies` 中。

### MY_RULES：自定义规则

```js
var MY_RULES = [
  'DOMAIN-SUFFIX,cn.bing.com,DIRECT',
  'GEOSITE,category-ai-!cn,🤖 AI',
  // 'DOMAIN-SUFFIX,example.com,DIRECT',
  // 'DOMAIN-SUFFIX,openai.com,🇺🇸 美国',
];
```

- 规则按数组顺序执行，整体排在订阅规则之前，因此优先命中。
- 目标可写 `DIRECT`、`REJECT`、节点全名或代理组名。
- 引用节点全名时，机场改名后会失效，优先引用分组名。
- 需要解析 IP 的规则可加 `,no-resolve` 避免触发 DNS 解析，例如 `IP-CIDR,192.168.50.0/24,DIRECT,no-resolve`。

### Antigravity 与 AI 接口

脚本已把 Antigravity / Gemini 的专用接口显式指向 `🤖 AI`：

```text
antigravity.googleapis.com
antigravity-pa.googleapis.com
antigravity.google / antigravity.goog
antigravity-unleash.goog
generativelanguage.googleapis.com
cloudcode-pa.googleapis.com
daily-cloudcode-pa.googleapis.com
aicode.googleapis.com
aiplatform.googleapis.com
us-central1-aiplatform.googleapis.com（区域端点）
autopush-aicode.sandbox.googleapis.com（灰度通道）
businessaicode.googleapis.com
alkalimakersuiteapplets.pa.googleapis.com
```

`fonts.googleapis.com`、`www.gstatic.com`、`lh3.googleusercontent.com`、`oauth2.googleapis.com`、`www.googleapis.com`、`play.googleapis.com` 属于 Google 公共域名，其他应用也在用，因此不单独指向 `🤖 AI`；它们不需要按 AI 使用地区选择出口。

另加了两条进程级兜底：`PROCESS-NAME,Antigravity.exe` 和 `PROCESS-NAME,language_server.exe`。这样 Antigravity 的登录、字体、资源、更新以及以后版本新增的域名都会统一走 `🤖 AI`，不需要每次升级补规则。生效前提是 FlClash 的 `find-process-mode` 不为 `off`；副作用是 Antigravity 的全部流量都会使用 AI 出口。若本机其他软件也带同名的 `language_server.exe`，应改用 `PROCESS-PATH` 精确匹配。

`🤖 AI` 组里有一个 `⏸️ 关闭（跟随 雪山·Link）` 成员，作为运行时开关。它是一个隐藏的透传组，唯一成员是主入口，因此不会在顶部多出一个分组标签。选中它后，AI 规则仍然存在，但 `🤖 AI` 会直接跟随主入口（当前是 `雪山·Link`）的节点选择；再选回任意地区即可恢复 AI 独立出口。主入口改名时，这个成员的标签会自动跟着变。

香港不是 Gemini API 的支持地区，`🤖 AI` 里请选台湾、日本、新加坡或美国。规则只影响新连接，切换后需要重启 Antigravity。

### 地区组规则

```js
var myGroup = regions[1].name;
var myGroupRules = buckets[1].length > 0
  ? [
      // 'DOMAIN-SUFFIX,google.com,' + myGroup,
    ]
  : [];
```

`regions[1]` 是 `regions` 数组的第二项（台湾）。调整地区顺序时索引要同步修改；该地区没有节点时，相关规则会整组跳过，避免引用不存在的分组。

要引用地区下的自动组，可启用：

```js
// var myAutoGroup = '♻️ ' + myGroup.replace(/^\S+\s*/, '') + '自动';
```

### 规则合并顺序

```text
MY_RULES → myGroupRules → 订阅原规则
```

## 注意事项

- 脚本只处理字符串形式的 `rules`。如果订阅把规则放在 `rule-providers` 中，脚本不会改写这些规则，只会在前面追加自定义规则。
- 地区归类按 `regions` 顺序取第一个匹配项，名称同时包含多个地区时以靠前的为准。
- 分组名由脚本生成，自定义规则和手动选择都要使用实际生成的名字；修改 `regions` 名称后需要同步调整。
- 订阅中已存在同名分组时，脚本不会重复创建，主入口会直接引用已有分组。
- 订阅规则没有指向任何现有 `select` 组时，脚本会把 `MATCH` 改为指向主入口组。
- 更新订阅后 FlClash 会重新执行脚本，自定义配置应保存在脚本里，不要手动修改生成的配置。
