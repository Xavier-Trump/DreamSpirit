import { redirect } from "next/navigation";

import { CommunityUniverseBuilder } from "@/components/community-universe-builder";
import { getReadOnlyMessage, getViewer } from "@/lib/demo";
import { getApprovedSharedDreams, getRecentUniverseStories } from "@/lib/community";

export default async function CommunityPage() {
  const viewer = await getViewer();
  if (!viewer?.id) {
    redirect("/sign-in");
  }

  const [sharedDreams, universeStories] = await Promise.all([getApprovedSharedDreams(), getRecentUniverseStories()]);

  return (
    <div className="community-grid">
      <div className="stack-lg">
        <section className="app-panel stack-lg">
          <div className="stack-sm">
            <span className="brand-mark">
              <span className="brand-orb" />
              Collective Pool
            </span>
            <h1 className="section-title">分享你的梦境，<br></br>同时也看看别人的故事</h1>
            <p className="muted-text">匿名公开的梦境会经过审核，进入共享池，一起织成大家的梦境宇宙</p>
          </div>

          <div className="dream-list">
            {sharedDreams.length === 0 ? (
              <div className="card">
                <div style={{ fontWeight: 800 }}>还没有公开梦境</div>
                <p className="helper-text">先在单条梦境详情页里提交匿名共享，审核通过后就会出现在这里。</p>
              </div>
            ) : (
              sharedDreams.map((dream) => (
                <div className="community-item stack-sm" key={dream.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 800 }}>{dream.title}</div>
                    <span className="status-badge status-success">已公开</span>
                  </div>
                  <p className="muted-text">{dream.excerpt}</p>
                  <div className="badge-row">
                    {dream.emotions.map((emotion) => (
                      <span className="chip" key={`${dream.id}-${emotion}`}>
                        {emotion}
                      </span>
                    ))}
                    {dream.themes.map((theme) => (
                      <span className="chip" key={`${dream.id}-${theme}`}>
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="stack-lg">
        <CommunityUniverseBuilder
          dreams={sharedDreams.map((dream) => ({
            id: dream.id,
            title: dream.title,
            excerpt: dream.excerpt,
            emotions: dream.emotions,
            themes: dream.themes
          }))}
          readOnly={!viewer.canWrite}
          readOnlyMessage={!viewer.canWrite ? getReadOnlyMessage("生成公共梦境宇宙") : undefined}
        />

        <section className="app-panel stack-md">
          <div>
            <div className="field-label">最近生成的梦境宇宙</div>
            <h2 className="panel-title">公共故事输出</h2>
          </div>
          {universeStories.length === 0 ? (
            <p className="helper-text">还没有公共宇宙故事，选择 3-5 条公开梦境后即可生成第一篇。</p>
          ) : (
            universeStories.map((story) => (
              <div className="story-block stack-sm" key={story.id}>
                <div style={{ fontWeight: 800 }}>宇宙故事 #{story.id.slice(-6)}</div>
                <p className="muted-text">{story.story.slice(0, 320)}...</p>
                <div className="helper-text">来源梦境：{story.sources.map((source) => source.sharedDream.title).join(" / ")}</div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
