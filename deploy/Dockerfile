# 教智星 Web 多阶段镜像：构建发行包后以 --web 模式对外提供服务。
# 构建耗时较长，需在仓库根上下文执行：docker build -f deploy/Dockerfile .

FROM node:24.14.0-bookworm AS build
WORKDIR /src
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
COPY . .
# 跳过桌面远程资源时可缩短时间；失败时请在宿主机先 pnpm bootstrap && pnpm build:zcode
RUN pnpm install --frozen-lockfile
RUN pnpm build:jzx

FROM node:24.14.0-bookworm-slim AS runtime
WORKDIR /app
# 办公技能执行在服务端；提供字体、格式转换及独立 Python 环境。
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-venv libreoffice-writer libreoffice-calc libreoffice-impress \
    poppler-utils pandoc tesseract-ocr tesseract-ocr-chi-sim fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*
COPY apps/zcode-cli/packages/bundled-skills/office-requirements.txt /tmp/office-requirements.txt
RUN python3 -m venv /opt/jzx-office && /opt/jzx-office/bin/pip install --no-cache-dir -r /tmp/office-requirements.txt \
    && npm install -g docx@9 pptxgenjs@4 echarts@5 sharp@0.34 react@19 react-dom@19 react-icons@5
ENV PATH="/opt/jzx-office/bin:${PATH}" NODE_PATH=/usr/local/lib/node_modules \
    MPLBACKEND=Agg
ENV NODE_ENV=production \
    PORT=3030 \
    JZX_SERVER_HOST=0.0.0.0 \
    JZX_SERVER_WORKSPACE=/workspace \
    ZCODE_DATA_BASE_DIR=/home/node \
    ZCODE_HOME=/home/node/.zcode
COPY --from=build /src/dist/jzx/ /app/
COPY deploy/entrypoint.sh /entrypoint.sh
# ECharts CLI 是技能的独立工具，ESM 按目录解析自己的依赖。
RUN cd /app/agent/packages/bundled-skills/skills/echarts-ai-skill && npm install && npm run build
RUN chmod +x /entrypoint.sh \
  && mkdir -p /workspace /home/node/.zcode \
  && chown -R node:node /app /workspace /home/node/.zcode
COPY --chown=node:node demo/jiaozhixing-course/ /workspace/
USER node
EXPOSE 3030
ENTRYPOINT ["/entrypoint.sh"]
