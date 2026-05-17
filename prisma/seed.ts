import {
  AnalysisStatus,
  AssetStatus,
  AssetType,
  DreamStatus,
  SharedDreamStatus,
  UniverseStoryStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { ensureUserDreamPreferences } from "@/lib/dream-preferences";
import {
  EXPERIENCE_ACCOUNT_EMAIL,
  EXPERIENCE_ACCOUNT_NAME,
  EXPERIENCE_ACCOUNT_PASSWORD,
  EXPERIENCE_ACCOUNT_PROFILE
} from "@/lib/experience-account-constants";
import { prisma } from "@/lib/prisma";

type DemoDreamSeed = {
  title: string;
  contentPlain: string;
  dreamedAt: Date;
  emotions: string[];
  clarity: number;
  isRecurring: boolean;
  realityConnection: string;
  status: DreamStatus;
  analysis: {
    symbolism: string;
    emotionAnalysis: string;
    stressFactors: string[];
    themes: string[];
    patternSignals: string[];
  };
  story: string;
  elements: Array<{
    type: string;
    value: string;
    normalized: string;
    count?: number;
  }>;
  imageUrl?: string;
  shared?: {
    anonymousProfileId: string;
    title: string;
    excerpt: string;
    contentPublic: string;
    emotions: string[];
    themes: string[];
    moderationStatus: SharedDreamStatus;
    publishedAt?: Date | null;
  };
};

function createRichDoc(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text
          }
        ]
      }
    ]
  };
}

const demoDreams: DemoDreamSeed[] = [
  {
    title: "漂浮城市与会说话的鲸",
    contentPlain:
      "我在一座漂浮的城市里醒来，街道像水面一样轻轻晃动，一头会说话的鲸从云层间穿过，提醒我不要错过最后一班列车。",
    dreamedAt: new Date("2026-04-03T06:20:00+08:00"),
    emotions: ["奇幻", "神秘", "轻微焦虑"],
    clarity: 4,
    isRecurring: false,
    realityConnection: "最近确实在为一次重要的转折做准备，总觉得自己必须赶上某个时间点。",
    status: DreamStatus.ACTIVE,
    analysis: {
      symbolism: "漂浮城市象征过渡状态，鲸代表深层直觉与被忽视的提醒。",
      emotionAnalysis: "整体以奇幻和轻微焦虑为主，反映你对变化既期待又紧张。",
      stressFactors: ["重要转折", "时间压力"],
      themes: ["城市", "海洋", "列车", "提醒"],
      patternSignals: ["转折前梦境活跃"]
    },
    story:
      "鲸跃过云层时，它带走了城市边缘最后一盏未熄的灯。我站在月台上，看见列车从晨雾里慢慢浮现，像一封迟到很久的回信。",
    elements: [
      { type: "character", value: "鲸", normalized: "鲸" },
      { type: "location", value: "漂浮城市", normalized: "漂浮城市" },
      { type: "object", value: "列车", normalized: "列车" },
      { type: "action", value: "提醒", normalized: "提醒" }
    ],
    imageUrl: "/brand/tg-image.png",
    shared: {
      anonymousProfileId: "starlit-echo",
      title: "漂浮城市的最后一班列车",
      excerpt: "一头会说话的鲸从云层穿过，提醒我别错过离开漂浮城市的最后列车。",
      contentPublic:
        "我站在漂浮城市的月台边，一头会说话的鲸从云层中滑过，像广播一样提醒我不要错过最后一班列车。",
      emotions: ["奇幻", "神秘"],
      themes: ["城市", "列车", "过渡"],
      moderationStatus: SharedDreamStatus.APPROVED,
      publishedAt: new Date("2026-04-05T09:00:00+08:00")
    }
  },
  {
    title: "考试大厅里没有门",
    contentPlain:
      "我抱着一叠空白试卷走进考试大厅，却发现所有墙面都没有门，监考老师只反复说时间已经开始了。",
    dreamedAt: new Date("2026-04-11T07:10:00+08:00"),
    emotions: ["焦虑", "压迫", "困惑"],
    clarity: 5,
    isRecurring: true,
    realityConnection: "最近在推进多个并行任务，常常担心自己准备得不够充分。",
    status: DreamStatus.ACTIVE,
    analysis: {
      symbolism: "无门的考场代表高压评价场景中缺乏退出路径，空白试卷映射对结果失控的担心。",
      emotionAnalysis: "焦虑与压迫感非常集中，属于典型的责任负荷型梦境。",
      stressFactors: ["绩效压力", "准备不足感", "截止日期"],
      themes: ["考试", "迷路", "规则", "时间"],
      patternSignals: ["重复梦境", "高压任务阶段触发"]
    },
    story:
      "铃声响起后，整个大厅像巨大的肺部一样缓慢起伏。每一张空白试卷上都浮现出一道门的轮廓，却在我伸手时退回纸背。",
    elements: [
      { type: "location", value: "考试大厅", normalized: "考试大厅" },
      { type: "character", value: "监考老师", normalized: "监考老师" },
      { type: "object", value: "试卷", normalized: "试卷" },
      { type: "state", value: "没有门", normalized: "没有门" }
    ],
    imageUrl: "/brand/bg-image.png",
    shared: {
      anonymousProfileId: "paper-moon",
      title: "没有出口的考试大厅",
      excerpt: "抱着空白试卷进入考场后，我突然发现四周没有任何门，只有倒计时在继续。",
      contentPublic:
        "我走进考试大厅，监考老师宣布时间开始，可所有墙面都没有门。我抱着空白试卷站在原地，像被规则锁住了一样。",
      emotions: ["焦虑", "压迫"],
      themes: ["考试", "时间", "规则"],
      moderationStatus: SharedDreamStatus.APPROVED,
      publishedAt: new Date("2026-04-13T14:20:00+08:00")
    }
  },
  {
    title: "雨夜追逐与断桥",
    contentPlain:
      "我在暴雨里被看不清脸的人追赶，跑到桥中央时，桥面突然断开，只剩一盏橙色路灯悬在对岸。",
    dreamedAt: new Date("2026-04-20T03:40:00+08:00"),
    emotions: ["恐惧", "紧张", "孤立"],
    clarity: 4,
    isRecurring: true,
    realityConnection: "这段时间一直在回避一个必须做出的决定，梦里像是被它持续追赶。",
    status: DreamStatus.ACTIVE,
    analysis: {
      symbolism: "追逐者常代表未面对的问题，断桥象征旧路径失效，对岸路灯提示仍存在可达的替代出口。",
      emotionAnalysis: "梦境以持续性高压和求生式紧张为主，反映决策回避带来的心理负担。",
      stressFactors: ["决策压力", "逃避冲突", "安全感下降"],
      themes: ["追逐", "暴雨", "桥", "逃离"],
      patternSignals: ["逃避型主题持续出现", "危险场景集中在夜间"]
    },
    story:
      "断桥像被一把巨大的剪刀裁开，雨水从边缘垂落成帘。对岸那盏橙灯没有照亮道路，却像在证明黑暗之外仍有人等我过去。",
    elements: [
      { type: "weather", value: "暴雨", normalized: "暴雨" },
      { type: "action", value: "追逐", normalized: "追逐" },
      { type: "location", value: "断桥", normalized: "断桥" },
      { type: "object", value: "路灯", normalized: "路灯" }
    ],
    imageUrl: "/brand/tg-image.png",
    shared: {
      anonymousProfileId: "amber-step",
      title: "断桥前的雨夜追逐",
      excerpt: "暴雨中有人追着我跑到桥中央，桥却突然断开，只剩对岸的一盏橙灯。",
      contentPublic:
        "我在暴雨里奔跑，身后有人追来。桥面在脚下突然断开，对岸只有一盏橙色路灯，像唯一还在等我的方向。",
      emotions: ["恐惧", "紧张"],
      themes: ["追逐", "桥", "夜晚"],
      moderationStatus: SharedDreamStatus.APPROVED,
      publishedAt: new Date("2026-04-22T18:10:00+08:00")
    }
  },
  {
    title: "会呼吸的图书馆",
    contentPlain:
      "我在一座会呼吸的图书馆里找出口，书架会像海浪一样前后起伏，每次拐弯都会回到同一张写着自己名字的借书卡前。",
    dreamedAt: new Date("2026-05-02T08:05:00+08:00"),
    emotions: ["迷失", "好奇", "疲惫"],
    clarity: 3,
    isRecurring: false,
    realityConnection: "最近信息输入很多，但始终没有整理出最适合自己的行动路径。",
    status: DreamStatus.ARCHIVED,
    analysis: {
      symbolism: "图书馆象征知识与记忆，重复回到借书卡说明你在外部信息里打转，仍需回到自我命题。",
      emotionAnalysis: "迷失感强于恐惧，更像长时间搜索后产生的认知疲劳。",
      stressFactors: ["信息过载", "方向不清", "选择困难"],
      themes: ["图书馆", "迷路", "名字", "循环"],
      patternSignals: ["探索型梦境", "现实中存在高信息负载"]
    },
    story:
      "每本书在呼吸时都会吐出一点灰白色的雾，我穿过它们，像在翻越一座座正在入睡的小山。那张写着我名字的借书卡却始终比出口更先出现。",
    elements: [
      { type: "location", value: "图书馆", normalized: "图书馆" },
      { type: "action", value: "迷路", normalized: "迷路" },
      { type: "object", value: "借书卡", normalized: "借书卡" },
      { type: "state", value: "循环", normalized: "循环" }
    ],
    imageUrl: "/brand/bg-image.png",
    shared: {
      anonymousProfileId: "quiet-index",
      title: "图书馆里的循环出口",
      excerpt: "我在会呼吸的图书馆里找门，却总会回到一张写着自己名字的借书卡前。",
      contentPublic:
        "书架像海浪一样起伏，我每次转弯都回到同一张借书卡前。那上面写着我的名字，像整座图书馆都在逼我先回答一个问题。",
      emotions: ["迷失", "好奇"],
      themes: ["图书馆", "迷路", "循环"],
      moderationStatus: SharedDreamStatus.PENDING,
      publishedAt: null
    }
  }
];

async function upsertDemoDream(userId: string, item: DemoDreamSeed) {
  const existing = await prisma.dream.findFirst({
    where: {
      userId,
      title: item.title
    },
    select: {
      id: true
    }
  });

  const dream = existing
    ? await prisma.dream.update({
        where: {
          id: existing.id
        },
        data: {
          title: item.title,
          contentRich: createRichDoc(item.contentPlain),
          contentPlain: item.contentPlain,
          dreamedAt: item.dreamedAt,
          emotions: item.emotions,
          clarity: item.clarity,
          isRecurring: item.isRecurring,
          realityConnection: item.realityConnection,
          status: item.status
        }
      })
    : await prisma.dream.create({
        data: {
          userId,
          title: item.title,
          contentRich: createRichDoc(item.contentPlain),
          contentPlain: item.contentPlain,
          dreamedAt: item.dreamedAt,
          emotions: item.emotions,
          clarity: item.clarity,
          isRecurring: item.isRecurring,
          realityConnection: item.realityConnection,
          status: item.status
        }
      });

  await prisma.dreamAnalysis.upsert({
    where: {
      dreamId: dream.id
    },
    update: {
      ...item.analysis,
      provider: "seed",
      version: "demo-v2",
      status: AnalysisStatus.COMPLETED
    },
    create: {
      dreamId: dream.id,
      ...item.analysis,
      provider: "seed",
      version: "demo-v2",
      status: AnalysisStatus.COMPLETED
    }
  });

  await prisma.dreamStory.upsert({
    where: {
      dreamId: dream.id
    },
    update: {
      content: item.story
    },
    create: {
      dreamId: dream.id,
      content: item.story
    }
  });

  await prisma.dreamElement.deleteMany({
    where: {
      dreamId: dream.id
    }
  });

  await prisma.dreamElement.createMany({
    data: item.elements.map((element) => ({
      dreamId: dream.id,
      type: element.type,
      value: element.value,
      normalized: element.normalized,
      count: element.count ?? 1
    }))
  });

  await prisma.dreamAsset.deleteMany({
    where: {
      dreamId: dream.id,
      type: AssetType.IMAGE
    }
  });

  if (item.imageUrl) {
    await prisma.dreamAsset.create({
      data: {
        dreamId: dream.id,
        type: AssetType.IMAGE,
        url: item.imageUrl,
        mimeType: "image/png",
        status: AssetStatus.READY
      }
    });
  }

  if (item.shared) {
    await prisma.sharedDream.upsert({
      where: {
        sourceDreamId: dream.id
      },
      update: {
        ...item.shared
      },
      create: {
        sourceDreamId: dream.id,
        ...item.shared
      }
    });
  }

  return dream;
}

async function ensureUniverseStory() {
  const existing = await prisma.universeStory.count({
    where: {
      status: UniverseStoryStatus.READY
    }
  });

  if (existing > 0) {
    return;
  }

  const sources = await prisma.sharedDream.findMany({
    where: {
      moderationStatus: SharedDreamStatus.APPROVED
    },
    orderBy: {
      publishedAt: "asc"
    },
    take: 3
  });

  if (sources.length < 3) {
    return;
  }

  await prisma.universeStory.create({
    data: {
      story:
        "三场彼此陌生的梦在雨夜的站台上相遇。漂浮城市的鲸从云层落下，替无门考场里的钟声按下暂停，又把断桥对岸那盏橙灯衔到所有人头顶。于是本该各自逃跑的人，第一次看见同一条能够继续前行的路。",
      status: UniverseStoryStatus.READY,
      generatedAt: new Date("2026-04-25T20:30:00+08:00"),
      sources: {
        create: sources.map((source, index) => ({
          sharedDreamId: source.id,
          orderIndex: index
        }))
      }
    }
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(EXPERIENCE_ACCOUNT_PASSWORD, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: EXPERIENCE_ACCOUNT_EMAIL },
    update: {
      name: EXPERIENCE_ACCOUNT_NAME,
      passwordHash,
      anonymousProfile: EXPERIENCE_ACCOUNT_PROFILE
    },
    create: {
      email: EXPERIENCE_ACCOUNT_EMAIL,
      name: EXPERIENCE_ACCOUNT_NAME,
      passwordHash,
      anonymousProfile: EXPERIENCE_ACCOUNT_PROFILE
    }
  });

  for (const item of demoDreams) {
    await upsertDemoDream(demoUser.id, item);
  }

  await ensureUserDreamPreferences(demoUser.id);
  await ensureUniverseStory();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
