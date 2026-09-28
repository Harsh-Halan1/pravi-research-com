import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="welcome-page">
      <div className="welcome-grid" />
      <header className="welcome-header">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">P</span>
          <span>
            PRAVI <small>PUBLIC ASSET REGISTRY</small>
          </span>
        </Link>
        <Link
          className="welcome-link"
          href={userId ? "/dashboard" : "/sign-in"}
        >
          {userId ? "Open workspace" : "Sign in"}{" "}
          <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <section className="welcome-hero">
        <p className="eyebrow">
          <span /> GOVERNMENT INFRASTRUCTURE, ACCOUNTED FOR
        </p>
        <h1>
          Every public asset.
          <br />
          <em>One accountable</em> lifecycle.
        </h1>
        <p className="welcome-copy">
          A shared operational record for the roads, bridges, and public
          infrastructure that communities depend on—from first registration to
          inspection and renewal.
        </p>
        <Link className="primary-cta" href={userId ? "/dashboard" : "/sign-in"}>
          Enter the workspace <span aria-hidden="true">→</span>
        </Link>
        <div className="welcome-footnote">
          <span className="status-pulse" />
          <span>Designed for public stewardship</span>
          <span className="footnote-separator">·</span>
          <span>Built around real workflows</span>
        </div>
      </section>
      <aside
        className="welcome-aside"
        aria-label="Asset lifecycle illustration"
      >
        <div className="map-orbit orbit-one" />
        <div className="map-orbit orbit-two" />
        <div className="map-orbit orbit-three" />
        <div className="map-node node-a">
          <span>01</span>
          <b>REGISTER</b>
        </div>
        <div className="map-node node-b">
          <span>02</span>
          <b>VERIFY</b>
        </div>
        <div className="map-node node-c">
          <span>03</span>
          <b>INSPECT</b>
        </div>
        <div className="map-node node-d">
          <span>04</span>
          <b>MAINTAIN</b>
        </div>
        <div className="route-line" />
        <div className="center-card">
          <div className="center-icon">⌁</div>
          <strong>Asset lifecycle</strong>
          <span>Connected. Traceable. Actionable.</span>
        </div>
        <div className="aside-caption">
          <span>FIELD NOTE / 001</span>
          <br />
          One record from first handover to the next generation of service.
        </div>
      </aside>
      <footer className="welcome-footer">
        <span>PRAVI · BUILD FOR BILLIONS</span>
        <span>PUBLIC INFRASTRUCTURE OPERATIONS</span>
      </footer>
      <style>{`
        .welcome-page { min-height:100vh; position:relative; overflow:hidden; display:grid; grid-template-rows:auto 1fr auto; padding:28px 6.2vw 22px; background:#f4f6f2; }
        .welcome-grid { position:absolute; inset:0 0 0 46%; pointer-events:none; opacity:.35; background-image:linear-gradient(#dbe3dc 1px,transparent 1px),linear-gradient(90deg,#dbe3dc 1px,transparent 1px); background-size:54px 54px; mask-image:linear-gradient(90deg,transparent,#000 30%); }
        .welcome-header,.welcome-footer { position:relative; z-index:3; display:flex; align-items:center; justify-content:space-between; }
        .brand-lockup { display:flex; align-items:center; gap:11px; font:800 13px Manrope,sans-serif; letter-spacing:.13em; }
        .brand-mark { display:grid; place-items:center; width:35px; height:35px; border-radius:11px 11px 11px 3px; color:#fff; background:#28684f; font:800 18px Manrope,sans-serif; }
        .brand-lockup small { display:block; margin-top:3px; font:600 8px "DM Sans",sans-serif; letter-spacing:.19em; color:#819087; }
        .welcome-link { display:flex; gap:13px; align-items:center; color:#36574a; font-size:13px; font-weight:700; }
        .welcome-link span { font-size:17px; }
        .welcome-hero { position:relative; z-index:2; width:min(56%,650px); align-self:center; padding:74px 0 94px 6.5vw; }
        .eyebrow { display:flex; align-items:center; gap:10px; margin-bottom:26px; color:#63806f; font-size:10px; font-weight:700; letter-spacing:.16em; }
        .eyebrow span,.status-pulse { width:7px; height:7px; border-radius:50%; background:#5b9b71; box-shadow:0 0 0 4px #dcebe0; }
        .welcome-hero h1 { margin:0; color:#1f352d; font:600 clamp(48px,6.15vw,84px)/1.02 Manrope,sans-serif; letter-spacing:-.065em; }
        .welcome-hero h1 em { color:#60866f; font-style:normal; }
        .welcome-copy { max-width:490px; margin:26px 0 28px; color:#738078; font-size:16px; line-height:1.8; }
        .primary-cta { display:inline-flex; align-items:center; gap:25px; padding:15px 19px; border-radius:5px; color:white; background:#28684f; box-shadow:0 10px 22px #28684f24; font-size:13px; font-weight:700; transition:transform .2s,background .2s; }
        .primary-cta:hover { transform:translateY(-2px); background:#1c4d3b; }
        .primary-cta span { font-size:18px; }
        .welcome-footnote { display:flex; gap:10px; align-items:center; margin-top:47px; color:#849087; font-size:10px; letter-spacing:.03em; }
        .welcome-footnote .status-pulse { width:6px; height:6px; box-shadow:none; }
        .footnote-separator { color:#b3bbb5; }
        .welcome-aside { position:absolute; top:10%; right:6.8vw; width:42vw; height:75vh; min-height:490px; max-height:740px; }
        .map-orbit { position:absolute; top:50%; left:50%; border:1px solid #cbd8ce; border-radius:50%; transform:translate(-50%,-50%) rotate(-24deg); }
        .orbit-one { width:94%; height:61%; }
        .orbit-two { width:75%; height:90%; transform:translate(-50%,-50%) rotate(32deg); }
        .orbit-three { width:61%; height:43%; border-style:dashed; transform:translate(-50%,-50%) rotate(10deg); }
        .route-line { position:absolute; width:77%; height:46%; top:27%; left:12%; border:2px solid transparent; border-bottom-color:#73a183; border-left-color:#73a183; border-radius:48% 0 0 42%; transform:rotate(-24deg); opacity:.8; }
        .center-card { position:absolute; top:50%; left:50%; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; width:192px; height:176px; border:1px solid #e3eae4; border-radius:50%; background:#fbfcf9; box-shadow:0 18px 45px #34534415; transform:translate(-50%,-50%); text-align:center; }
        .center-icon { display:grid; place-items:center; width:44px; height:44px; margin-bottom:13px; border-radius:14px 14px 14px 4px; color:white; background:#39775a; font:32px Manrope,sans-serif; }
        .center-card strong { font:700 13px Manrope,sans-serif; }
        .center-card span { margin-top:6px; color:#8a958d; font-size:9px; }
        .map-node { position:absolute; z-index:3; display:flex; align-items:center; gap:8px; padding:9px 11px 9px 8px; border:1px solid #e2e9e3; border-radius:4px; background:#fff; box-shadow:0 8px 24px #294a3712; font-size:9px; letter-spacing:.08em; }
        .map-node span { display:grid; place-items:center; width:22px; height:22px; border-radius:50%; background:#edf4ee; color:#4e7a5e; font-size:8px; }
        .map-node b { font-weight:700; }
        .node-a { top:21%; left:22%; } .node-b { top:23%; right:10%; } .node-c { bottom:24%; right:12%; } .node-d { bottom:18%; left:20%; }
        .aside-caption { position:absolute; right:0; bottom:1%; width:185px; color:#77847b; font-size:10px; line-height:1.6; }
        .aside-caption span { color:#9ca79f; font-size:8px; font-weight:700; letter-spacing:.14em; }
        .welcome-footer { border-top:1px solid #e1e7e1; padding-top:16px; color:#929d95; font-size:8px; font-weight:700; letter-spacing:.14em; }
        @media(max-width:900px) { .welcome-hero { width:68%; padding-left:2vw; } .welcome-aside { right:-8vw; width:46vw; opacity:.66; } }
        @media(max-width:680px) { .welcome-page { padding:20px 6vw 16px; } .welcome-hero { width:100%; padding:85px 0 230px; } .welcome-hero h1 { font-size:clamp(46px,13vw,70px); } .welcome-copy { font-size:14px; } .welcome-aside { top:auto; bottom:54px; right:0; width:100%; height:270px; min-height:0; max-height:none; opacity:.55; } .center-card { width:135px; height:125px; } .center-icon { width:32px; height:32px; font-size:25px; margin-bottom:8px; } .center-card strong { font-size:10px; } .center-card span { font-size:7px; } .map-node { transform:scale(.8); } .node-a { top:12%; } .node-b { top:12%; } .node-c { bottom:8%; } .node-d { bottom:7%; } .aside-caption { display:none; } .welcome-footnote { margin-top:30px; flex-wrap:wrap; } .welcome-footer span:last-child { display:none; } }
      `}</style>
    </main>
  );
}
