import { ModerationDecision, SharedDreamStatus } from "@prisma/client";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const mainlandPhonePattern = /(?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}/g;
const idCardPattern = /\b\d{6}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
const urlPattern = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const qqPattern = /(?:QQ|qq|企鹅号|扣扣)\s*[:：]?\s*\d{5,12}/g;
const wechatPattern = /(?:微信|wechat|weixin|vx|V信|微\s*信)\s*[:：]?\s*[a-zA-Z][-_a-zA-Z0-9]{4,19}/gi;
const contactIntentPattern = /(加我|私聊|联系我|约我|找我|可联系|联系方式|电话联系|微信联系|QQ联系|进群|群号|接单|下单)/i;
const longNumberPattern = /\b\d[\d\s-]{14,}\d\b/g;
const repeatedCharPattern = /(.)\1{8,}/;
const excessivePunctuationPattern = /[!?！？。,.，、]{12,}/;

const rejectPatterns = [
  { pattern: /(裸照|偷拍视频|偷拍|未成年.{0,12}(色情|性|裸|约)|儿童色情|萝莉资源|幼女资源)/i, flag: "疑似违法色情内容" },
  { pattern: /(强奸|迷奸|下药|性侵|猥亵|恋童|兽交)/i, flag: "疑似严重性暴力内容" },
  { pattern: /(卖号|代开票|办证|洗钱|跑分|赌博平台|博彩平台|网赌|现金网|代赌|私彩)/i, flag: "疑似违法交易内容" },
  { pattern: /(人肉|开盒|盒武器|泄露隐私|查户籍|查定位|查身份证|查手机号)/i, flag: "疑似侵犯他人隐私" },
  { pattern: /(自制炸药|制毒|贩毒|买枪|卖枪|枪支弹药|爆炸物教程)/i, flag: "疑似危险违法内容" },
  { pattern: /(杀人教程|报复社会|校园袭击|无差别袭击|恐怖袭击)/i, flag: "疑似暴力危害内容" }
];

const reviewPatterns = [
  { pattern: /(自杀|轻生|不想活|结束生命|割腕|跳楼|服药自尽)/i, flag: "包含自伤或危机表达" },
  { pattern: /(杀了他|弄死|砍死|捅死|报仇|仇恨|极端愤怒)/i, flag: "包含暴力或伤害表达" },
  { pattern: /(毒品|冰毒|海洛因|大麻|摇头丸|麻古|K粉)/i, flag: "包含毒品相关表达" },
  { pattern: /(身份证|银行卡|住址|家庭住址|门牌号|详细地址|定位|手机号|微信号)/i, flag: "包含敏感个人信息表达" },
  { pattern: /(色情|性交易|约炮|援交|嫖娼|裸聊)/i, flag: "包含成人或性相关表达" },
  { pattern: /(广告|推广|返利|引流|代理|兼职赚钱|投资群|荐股|稳赚)/i, flag: "疑似营销或引流内容" }
];

type LocalModerationResult = {
  approved: boolean;
  decision: ModerationDecision;
  sharedStatus: SharedDreamStatus;
  title: string;
  content: string;
  excerpt: string;
  riskFlags: string[];
  notes: string;
};

function unique(items: string[]) {
  return [...new Set(items)];
}

function compactText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function redactWithFlag(input: string, pattern: RegExp, replacement: string, flag: string, flags: string[]) {
  pattern.lastIndex = 0;
  if (!pattern.test(input)) {
    return input;
  }

  pattern.lastIndex = 0;
  flags.push(flag);
  return input.replace(pattern, replacement);
}

function hasEnoughReadableText(text: string) {
  const compact = compactText(text);
  const chineseChars = compact.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const latinWords = compact.match(/[a-zA-Z]{2,}/g)?.length ?? 0;
  return compact.length >= 20 && chineseChars + latinWords * 2 >= 8;
}

function collectPatternFlags(text: string, items: Array<{ pattern: RegExp; flag: string }>) {
  return items.filter((item) => item.pattern.test(text)).map((item) => item.flag);
}

function buildExcerpt(content: string) {
  const excerpt = content.slice(0, 220);
  return excerpt.length < content.length ? `${excerpt}...` : excerpt;
}

export function moderateSharedDreamLocally(input: { title: string; content: string }): LocalModerationResult {
  const riskFlags: string[] = [];
  const reviewFlags: string[] = [];
  const rejectFlags: string[] = [];
  const originalText = `${input.title}\n${input.content}`;
  let title = compactText(input.title);
  let content = compactText(input.content);

  if (!hasEnoughReadableText(content)) {
    rejectFlags.push("公开内容过短或可读性不足");
  }

  if (repeatedCharPattern.test(content) || excessivePunctuationPattern.test(content)) {
    rejectFlags.push("疑似重复字符或无效内容");
  }

  rejectFlags.push(...collectPatternFlags(originalText, rejectPatterns));
  reviewFlags.push(...collectPatternFlags(originalText, reviewPatterns));

  title = redactWithFlag(title, emailPattern, "[邮箱已隐藏]", "已隐藏邮箱", riskFlags);
  content = redactWithFlag(content, emailPattern, "[邮箱已隐藏]", "已隐藏邮箱", riskFlags);
  title = redactWithFlag(title, mainlandPhonePattern, "[手机号已隐藏]", "已隐藏手机号", riskFlags);
  content = redactWithFlag(content, mainlandPhonePattern, "[手机号已隐藏]", "已隐藏手机号", riskFlags);
  title = redactWithFlag(title, idCardPattern, "[身份证号已隐藏]", "已隐藏身份证号", riskFlags);
  content = redactWithFlag(content, idCardPattern, "[身份证号已隐藏]", "已隐藏身份证号", riskFlags);
  title = redactWithFlag(title, urlPattern, "[链接已隐藏]", "已隐藏链接", riskFlags);
  content = redactWithFlag(content, urlPattern, "[链接已隐藏]", "已隐藏链接", riskFlags);
  title = redactWithFlag(title, qqPattern, "[QQ已隐藏]", "已隐藏 QQ", riskFlags);
  content = redactWithFlag(content, qqPattern, "[QQ已隐藏]", "已隐藏 QQ", riskFlags);
  title = redactWithFlag(title, wechatPattern, "[微信号已隐藏]", "已隐藏微信号", riskFlags);
  content = redactWithFlag(content, wechatPattern, "[微信号已隐藏]", "已隐藏微信号", riskFlags);
  title = redactWithFlag(title, longNumberPattern, "[长数字已隐藏]", "已隐藏疑似账号或证件号", riskFlags);
  content = redactWithFlag(content, longNumberPattern, "[长数字已隐藏]", "已隐藏疑似账号或证件号", riskFlags);

  if (contactIntentPattern.test(originalText)) {
    reviewFlags.push("包含联系或引流意图");
  }

  if (riskFlags.length >= 3) {
    reviewFlags.push("个人信息命中项较多");
  }

  const finalRejectFlags = unique(rejectFlags);
  const finalReviewFlags = unique(reviewFlags);
  const finalRiskFlags = unique([...riskFlags, ...finalReviewFlags, ...finalRejectFlags]);
  const decision =
    finalRejectFlags.length > 0 ? ModerationDecision.REJECTED : finalReviewFlags.length > 0 ? ModerationDecision.PENDING : ModerationDecision.APPROVED;
  const sharedStatus =
    decision === ModerationDecision.APPROVED ? SharedDreamStatus.APPROVED : decision === ModerationDecision.PENDING ? SharedDreamStatus.PENDING : SharedDreamStatus.REJECTED;
  const approved = decision === ModerationDecision.APPROVED;
  const notes =
    decision === ModerationDecision.APPROVED
      ? riskFlags.length > 0
        ? "本地规则审核通过，疑似个人信息已脱敏。"
        : "本地规则审核通过。"
      : decision === ModerationDecision.PENDING
        ? `本地规则建议二次复核：${finalReviewFlags.join("、")}。已先完成可识别个人信息脱敏。`
        : `本地规则审核未通过：${finalRejectFlags.join("、")}。`;

  return {
    approved,
    decision,
    sharedStatus,
    title: title || "匿名梦境",
    content,
    excerpt: buildExcerpt(content),
    riskFlags: finalRiskFlags,
      notes
  };
}
