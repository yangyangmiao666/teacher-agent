# 教智星 Web 阿里云部署与测试交付

当前已完成源码和本地构建/鉴权验证，尚未获得阿里云主机与域名信息，不能声明已经公网部署。下列命令从仓库根目录执行。

## 1. 服务器与运行边界

使用阿里云 ECS/轻量服务器、Linux、Docker Engine 与 Compose v2。构建包含大型依赖，建议至少 4 核/8 GB 或在同架构 Linux 构建机生成镜像。开放 22、443；8080 只用于受限测试，HTTPS 上线后绑定回环地址并由反向代理访问。规格选择需按实际并发测量。

测试令牌允许容器内 Agent、文件、终端操作，不是只读访客账号，也不是隔离的多用户教师系统。仅向受信评审提供访问，不挂载 Docker socket、SSH 私钥、宿主目录或校内/企业生产数据。容器使用非 root 用户、禁用提权、移除 capabilities，演示课程和模型配置保存在命名卷中。以上措施不构成防止所有恶意 Agent 操作的安全沙箱。

## 2. 配置限时测试凭据

```bash
cp deploy/.env.deploy.example deploy/.env
node scripts/gen-test-access.mjs --base-url https://YOUR_ACTUAL_DOMAIN --days 30
```

将私有 `deploy/access-output/access.env` 中的 **两项**复制到 `deploy/.env`：`JZX_SERVER_AUTH_TOKEN` 和 `JZX_SERVER_AUTH_EXPIRES_AT`。同时填写实际 `JZX_PUBLIC_BASE_URL`。占位值不能直接部署。

生成物：ACCESS.md（权限、密码和 UTC 有效期）、token.txt、access.env、真实 qrcode.png。文件权限 0600，目录不入库且不进入 Docker 上下文。二维码含凭据，仅私下发送受信评审。默认生成日期不等于云上已经上线日期；有效期由服务端执行，轮换时重新生成并重建服务。

## 3. 构建与运行

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
```

镜像固定 Node 24.14.0、pnpm 10.33.2，依赖按锁文件安装，使用 `pnpm build:jzx` 生成真正可运行的目录，不依赖下载分发域名。命名卷首次从镜像初始化虚构演示课程，后续保留文件产物；更新镜像不会自动覆盖教师编辑的课程数据。禁止在未备份情况下删除卷。

源码本地验证可用：

```bash
pnpm build:jzx
# 仅本机验证，不表示已上公网
node dist/jzx/bin/zcode.mjs --web --host 127.0.0.1 --port 3030 --workspace "$PWD/demo/jiaozhixing-course" --no-open --no-token
```

## 4. 配置模型

登录测试环境后，在设置→模型供应商中添加自定义供应商，配置实际授权的 API 地址、密钥和模型 ID。配置保存在服务端命名卷，不嵌入浏览器构建。仅设置 `BIGMODEL_API_KEY` 或 `OPENAI_API_KEY` 不等于已注册可用模型；现有代码没有自动将这些环境变量注册为供应商的逻辑。本地核验环境没有可用模型，因此尚未完成真实生成验收。不要把密钥写进申报截图或材料包。

## 5. HTTPS 反向代理

在实际域名解析、证书和安全组配置完成后，反代同一容器端口；WebSocket 设置：

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
    # HTTPS 外部终止时为服务端签发的 Cookie 添加 Secure 标记
    proxy_cookie_flags zcode_lite_token secure httponly samesite=lax;
}
```

Compose 的 ports 可改为 `127.0.0.1:8080:3030`。不要记录含 token 查询串的访问日志，也不要把二维码页纳入公开索引。

## 6. 上线验收与交付

- 无凭据打开首页：显示限时口令登录；错误/到期口令不能访问 API 或 WebSocket。
- 有效口令进入工作台：核验七子台、移动端导航、草稿编辑/刷新/下载。
- 配置模型后分别核验教案、课件提纲、案例、组卷、评阅、学情、实训生成，记录教师校对和产物路径。
- 用临时短有效期环境核验已有 WebSocket 到期关闭；到期不自动撤销已提交任务，须运维停止任务/容器。
- 在异网手机扫描二维码，验证 HTTPS 公网地址、登录与实际生成后，记录日期，将 ACCESS.md 填入正式材料。

对外测试说明应写明：实际 HTTPS URL、限时共享口令（无独立用户名）、容器内使用权限、UTC/北京时间到期日期、虚构数据范围及管理员联系渠道。当前只提供本地测试配置，不能把 127.0.0.1 或占位域名当作公开测试链接。

## 7. 数据与申报

真实学生、企业、校内平台资料须先在授权环境脱敏，再上传。现有提示词不自动阻断所有隐私输入；公网演示不接生产数据。材料打包使用 `pnpm build:submission`，原始/匿名版均为待审核草稿。真实成效、师生反馈、来源贡献记录及学校审核公章需补齐。

### 本地开发访问

先运行 `pnpm gen:test-access -- --base-url http://localhost:5173` 生成私有访问配置，再运行 `pnpm dev:web`。开发服务也读取该配置，5173 代理与 3030 API/WS 共用口令及有效期。配置缺失时开发服务停止启动。若本地需易输入口令，在终端设置 `JZX_SERVER_AUTH_TOKEN` 后，为生成命令增加 `--local-simple-password`；该选项仅接受回环地址。轮换后重启开发服务，旧登录 Cookie 失效。
