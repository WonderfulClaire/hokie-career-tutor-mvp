# Career Pro AI

一个面向求职准备的 AI 助手：上传 PDF 简历、粘贴目标岗位 JD，获得匹配分析；随后可以进入文字或视频模拟面试，并生成结构化复盘报告。

> 当前状态：可运行的 MVP / 学习原型。适合本地体验与继续开发，尚未按生产环境的安全和隐私标准部署。

## 核心功能

### 1. 简历与岗位匹配

- 从 PDF 简历中提取文本。
- 对照 Job Description 分析简历。
- 流式输出匹配度、优势、缺失技能、优化建议和备考问题。
- 使用 Markdown 展示结构化分析结果。

### 2. AI 模拟面试

支持两种模式：

- **Text Mode**：通过文字完成逐题模拟面试。
- **Video Mode**：显示本地摄像头预览，支持浏览器语音识别和语音合成，模拟面对面交流。

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

- React 19
- TypeScript
- Vite
- Google Gemini API（`@google/genai`）
- React Markdown
- PDF.js
- Tailwind CSS（CDN）
- Web Speech API
- MediaDevices API

## 本地运行

### 环境要求

- Node.js 18+
- npm
- Gemini API key
- 推荐使用支持 Web Speech API 和摄像头权限的 Chromium 浏览器

### 安装

```bash
git clone https://github.com/WonderfulClaire/hokie-career-tutor-mvp.git
cd hokie-career-tutor-mvp
npm install
```

在项目根目录创建 `.env.local`：

```env
GEMINI_API_KEY=your_gemini_api_key
```

启动开发服务器：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

构建生产版本：

```bash
npm run build
```

## 项目结构

```text
.
├── App.tsx                    # 主界面与交互状态
├── index.tsx                  # React 入口
├── types.ts                   # 共享类型
├── services/
│   ├── geminiService.ts       # 简历分析、模拟面试和报告生成
│   └── pdfService.ts          # PDF 文本提取
├── vite.config.ts             # Vite 与环境变量配置
└── package.json
```

## 隐私与安全说明

这个项目会处理简历、岗位描述和模拟面试内容。使用前请注意：

- 简历文本和面试内容会发送给配置的 Gemini API。
- 不要上传包含身份证号、家庭住址、私人电话等非必要敏感信息的简历。
- 当前 Vite 配置会把 `GEMINI_API_KEY` 注入浏览器端代码，**只适合本地原型，不适合直接公开部署**。
- 如果要上线，应将 Gemini API 调用迁移到受控后端，并加入鉴权、限流、日志脱敏、数据保留策略和密钥轮换。
- 摄像头画面仅用于本地预览；当前代码没有主动上传视频流，但仍应只在可信环境中授权摄像头。

## 当前限制

- PDF 提取以文本型 PDF 为主，扫描件尚未接入 OCR。
- 面试评估来自生成式模型，不应视为真实招聘结论。
- 视频模式目前是摄像头预览、语音识别和语音合成，不包含视觉行为分析。
- 浏览器对语音识别的支持程度不同。
- 尚未加入自动化测试、后端服务、用户系统和历史记录管理。
- 当前模型名写在 `services/geminiService.ts` 中，升级模型时需要同步检查 SDK 兼容性。

## 后续路线

- [ ] 把 Gemini 调用迁移到后端，保护 API key。
- [ ] 加入 OCR，支持扫描版简历。
- [ ] 支持保存多份 JD 和多轮面试记录。
- [ ] 增加岗位类型、难度和面试官风格设置。
- [ ] 为 Prompt、PDF 解析和核心交互补充测试。
- [ ] 增加数据删除、导出和隐私设置。
- [ ] 补充产品截图或在线演示。

## License

当前仓库尚未声明开源许可证。在添加 License 前，默认不授予复制、修改或再分发代码的权利。
