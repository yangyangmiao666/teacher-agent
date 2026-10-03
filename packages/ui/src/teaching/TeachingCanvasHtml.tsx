import { useEffect, useMemo, useRef, useState } from "react";

/** 用户 HTML 只负责内容/CSS；交互由固定桥承接，避免生成脚本读取宿主或发送网络请求。 */
export function TeachingCanvasHtml({
  html,
  onAction,
}: {
  html: string;
  onAction: (prompt: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const doc = useMemo(() => {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed
      .querySelectorAll("script,iframe,object,embed,meta,base,link")
      .forEach((el) => el.remove());
    parsed.querySelectorAll("*").forEach((el) => {
      for (const attr of el.getAttributeNames()) {
        if (/^on/i.test(attr) || ["href", "action", "formaction", "srcdoc", "nonce"].includes(attr))
          el.removeAttribute(attr);
      }
    });
    const nonce = crypto.randomUUID().replaceAll("-", "");
    // scrollHeight 含 iframe 自身视口，不能当内容高度回写；按 body 内容测量以稳定滚动布局。
    const bridge = `(function(){function post(v){parent.postMessage(Object.assign({type:'jzx-canvas'},v),'*')}document.addEventListener('click',function(e){var el=e.target.closest('[data-jzx-prompt]');if(el){e.preventDefault();post({name:'action',prompt:el.getAttribute('data-jzx-prompt')})}});document.addEventListener('submit',function(e){e.preventDefault();var f=e.target;var p=f.getAttribute('data-jzx-prompt');if(p)post({name:'action',prompt:p+'\\n'+JSON.stringify(Object.fromEntries(new FormData(f)))})});new ResizeObserver(function(){post({name:'resize',height:Math.ceil(document.body.getBoundingClientRect().height)+2})}).observe(document.body)})();`;
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none';"><style>body{font:14px/1.6 system-ui;color:#172554;background:#fff;padding:16px;margin:0}*{box-sizing:border-box;max-width:100%}button,input{font:inherit;padding:8px;border:1px solid #cbd5e1;border-radius:6px}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}</style>${parsed.head.innerHTML}</head><body>${parsed.body.innerHTML}<script nonce="${nonce}">${bridge}</script></body></html>`;
  }, [html]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== "jzx-canvas")
        return;
      if (event.data.name === "resize" && Number.isFinite(event.data.height))
        setHeight(Math.max(160, Math.min(1000, event.data.height)));
      if (
        event.data.name === "action" &&
        typeof event.data.prompt === "string" &&
        event.data.prompt.trim() &&
        event.data.prompt.length <= 4000
      )
        onAction(event.data.prompt);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onAction]);
  return (
    <iframe
      ref={frame}
      title="教学 HTML / Teaching HTML"
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={doc}
      className="w-full rounded-lg border border-border"
      style={{ height }}
    />
  );
}
