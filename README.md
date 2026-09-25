# Career Pro AI

一个面向求职准备的 AI 助手：上传 PDF 简历、粘贴目标岗位 JD，获得匹配分析；随后可以进入文字或视频模拟面试，并生成结构化复盘报告。

**🌐 在线体验：https://hokie-career-tutor-mvp-three.vercel.app**（当前为演示模式，返回模拟内容；在 Vercel 配置 `GEMINI_API_KEY` 后即为真实 AI）

> 当前状态：可运行的全栈 MVP。前端 + Node/Express 后端，Gemini API key 保存在服务端。**无需 API key 也能运行**（自动进入「演示模式」，返回模拟内容），因此可以直接部署一个随时可体验的在线地址。

## 核心功能

### 1. 简历与岗位匹配

- 上传 PDF 简历或直接粘贴文本，也可一键载入内置示例数据快速体验。
- 对照 Job Description 分析简历。
- 流式输出分析内容，顶部展示可视化「匹配度评分环」。
- 使用 Markdown 展示优势、缺失技能、优化建议和备考问题。
- 支持中途「停止生成」。

### 2. AI 模拟面试

支持两种模式：

- **Text Mode**：通过文字完成逐题模拟面试。
- **Video Mode**：显示本地摄像头预览，支持浏览器语音识别和语音合成，模拟面对面交流。

面试界面提供实时计时器和已回答题数统计。

AI 面试官会结合简历和 JD：

1. 每次提出一个问题；
2. 对回答给出简短反馈；
3. 继续追问简历与岗位之间的关键差距；
4. 在结束后生成面试表现报告。

### 3. 面试复盘

结束面试后生成：

- 总体评分；
- 表达清晰度反馈；
- 技术能力反馈；
- 已展现的优势；
- 可执行的改进建议。

报告支持一键复制全文和下载为 Markdown 文件。

### 4. 产品体验

- 🌏 中英文双语界面，导航栏一键切换，默认跟随浏览器语言（AI 回复语言随界面语言）。
- 📱 移动端适配：手机上通过「输入 / 结果」Tab 切换查看。
- 💾 简历、JD 与分析结果自动保存在本地，刷新页面不丢失。
- 🔔 页面内 Toast 提示替代弹窗，交互更流畅。

## 使用流程

```text
上传 PDF 简历
    ↓
粘贴目标岗位 JD
    ↓
生成简历匹配分析
    ↓
选择文字或视频模拟面试
    ↓
结束面试并生成复盘报告
```

## 技术栈

**前端**

- React 19 + TypeScript + Vite
- React Markdown
- PDF.js（CDN）
- Tailwind CSS（CDN）
- Web Speech API / MediaDevices API

**后端**

- Node.js + Express
- Google Gemini API（`@google/genai`），仅在服务端调用
- 演示模式：未配置 API key 时返回模拟内容

### 架构

```text
浏览器 (React)  ──fetch──▶  Express 后端 (/api/*)  ──▶  Gemini API
                                     │
                              GEMINI_API_KEY 只存在于服务端
```

- `/api/analyze`、`/api/interview` 以纯文本流式返回。
- `/api/report` 返回完整报告。
- `/api/status` 返回是否处于演示模式（前端据此显示 DEMO MODE 标签）。
- 模拟面试改为无状态：前端每轮把完整对话历史发给后端。

## 本地运行

### 环境要求

- Node.js 18+
- npm
- Gemini API key（可选；不配置时使用演示模式）
- 推荐使用支持 Web Speech API 和摄像头权限的 Chromium 浏览器

### 安装

```bash
git clone https://github.com/WonderfulClaire/hokie-career-tutor-mvp.git
cd hokie-career-tutor-mvp
npm install
```

（可选）启用真实 AI：复制 `.env.example` 为 `.env` 并填入密钥。**不填也能跑**，只是会以演示模式运行：

```env
GEMINI_API_KEY=your_gemini_api_key
# 可选：GEMINI_MODEL=gemini-2.5-flash
# 可选：PORT=8787
```

### 开发模式（前后端一起启动）

```bash
npm run dev
```

- 前端：http://localhost:3000 （Vite，已将 `/api` 代理到后端）
- 后端：http://localhost:8787

访问 http://localhost:3000 即可使用。

### 生产构建与启动（单一 Node 服务）

```bash
npm run build   # 构建前端到 dist/
npm start       # Express 同时提供静态页面与 /api
```

默认访问 http://localhost:8787

## 部署（获得在线体验地址）

### Vercel（当前在线演示的部署方式）

仓库已内置 `vercel.json` 与 `api/index.js`（Serverless 入口，复用 `server/app.js`）：

```bash
npm i -g vercel
vercel --prod
```

可选：在 Vercel 项目设置中添加环境变量 `GEMINI_API_KEY` 启用真实 AI。

### 其他平台（Render / Railway / Fly.io 等常驻 Node 服务）

- **Build command**: `npm install && npm run build`
- **Start command**: `npm start`
- **环境变量**（可选）：`GEMINI_API_KEY`、`GEMINI_MODEL`
- 平台会注入 `PORT`，服务已自动读取。

若未配置 `GEMINI_API_KEY`，站点会以演示模式展示完整流程。

## 项目结构

```text
.
├── App.tsx                    # 主界面与交互状态
├── index.tsx                  # React 入口
├── types.ts                   # 共享类型
├── services/
│   ├── geminiService.ts       # 前端调用后端 /api/* 的封装（含流式）
│   └── pdfService.ts          # PDF 文本提取
├── server/
│   ├── index.js               # 本地/常驻 Node 服务：静态页面 + /api
│   ├── app.js                 # Express 应用（/api 路由，被两种入口复用）
│   ├── gemini.js              # Gemini 调用与演示模式回退
│   └── env.js                 # 轻量 .env 加载
├── api/
│   └── index.js               # Vercel Serverless 入口
├── vercel.json                # Vercel 部署配置
├── vite.config.ts             # Vite 与 /api 代理配置
└── package.json
```

## 隐私与安全说明

这个项目会处理简历、岗位描述和模拟面试内容。使用前请注意：

- 简历文本和面试内容会经由后端发送给配置的 Gemini API。
- 不要上传包含身份证号、家庭住址、私人电话等非必要敏感信息的简历。
- `GEMINI_API_KEY` 现已保留在**服务端**，不会注入浏览器。仍建议在生产环境中补充鉴权、限流、日志脱敏与密钥轮换。
- 摄像头画面仅用于本地预览；当前代码没有主动上传视频流，但仍应只在可信环境中授权摄像头。

## 当前限制

- PDF 提取以文本型 PDF 为主，扫描件尚未接入 OCR。
- 面试评估来自生成式模型，不应视为真实招聘结论。
- 视频模式目前是摄像头预览、语音识别和语音合成，不包含视觉行为分析。
- 浏览器对语音识别的支持程度不同。
- 已有 Node/Express 后端；尚未加入自动化测试、用户系统和多轮历史记录管理。
- 模型由服务端 `server/gemini.js` 读取 `GEMINI_MODEL`，默认值为 `gemini-2.5-flash`；升级时需要核对模型可用性与 SDK 兼容性。

## 后续路线

- [x] 把 Gemini 调用迁移到后端，保护 API key。
- [x] 增加面试难度、职位聚焦和面试官风格设置。
- [x] 支持将复盘报告导出为文件。
- [ ] 加入 OCR，支持扫描版简历。
- [ ] 支持保存多份 JD 和多轮面试记录。
- [ ] 为 Prompt、PDF 解析和核心交互补充测试。
- [ ] 在生产部署中补充鉴权、限流与数据删除/导出。
- [x] 提供在线演示入口。
- [ ] 补充产品截图。

## License

当前仓库尚未声明开源许可证。在添加 License 前，默认不授予复制、修改或再分发代码的权利。
