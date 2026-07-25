import { Lang } from './types';

/**
 * Built-in sample resume + JD so visitors can try the full flow
 * without uploading anything ("Try with sample data" button).
 */

const SAMPLE_RESUME_EN = `ALEX CHEN
Software Engineer | alex.chen@email.com | github.com/alexchen

SUMMARY
Full-stack engineer with 3 years of experience building web applications with React, TypeScript and Node.js. Passionate about developer experience and product quality.

EXPERIENCE
Software Engineer — Nova Labs (2023.06 – Present)
- Built and maintained a customer analytics dashboard (React + TypeScript) used by 40+ enterprise clients.
- Designed REST APIs with Node.js/Express serving ~2M requests/day; reduced p95 latency by 35%.
- Introduced end-to-end tests (Playwright), cutting production regressions by half.

Frontend Engineer Intern — Cloudio (2022.06 – 2022.09)
- Implemented a component library with 30+ reusable UI components adopted by 3 product teams.
- Improved Lighthouse performance score of the marketing site from 61 to 94.

PROJECTS
OpenTrack — open-source project tracking tool (1.2k GitHub stars)
- Led architecture: React, Vite, Express, PostgreSQL; implemented realtime updates via WebSocket.

EDUCATION
B.S. in Computer Science, State University (2019 – 2023)

SKILLS
TypeScript, React, Node.js, Express, PostgreSQL, Redis, Docker, CI/CD, AWS (EC2/S3)`;

const SAMPLE_JD_EN = `Senior Frontend Engineer — FinTech SaaS

Responsibilities:
- Own core features of our React + TypeScript trading dashboard.
- Collaborate with designers and backend engineers to ship high-quality UI.
- Drive performance optimization and frontend architecture decisions.
- Mentor junior engineers and champion best practices.

Requirements:
- 3+ years of experience with modern React and TypeScript.
- Solid understanding of web performance, testing, and CI/CD.
- Experience with data visualization (charts, realtime updates).
- Familiarity with Node.js backends and REST/WebSocket APIs.
- Nice to have: fintech experience, GraphQL, AWS.`;

const SAMPLE_RESUME_ZH = `陈磊
软件工程师 | chenlei@email.com | github.com/chenlei

个人简介
3 年全栈开发经验，主攻 React、TypeScript 与 Node.js，注重工程质量与用户体验。

工作经历
软件工程师 — 星河科技（2023.06 – 至今）
- 负责企业客户数据分析平台前端（React + TypeScript），服务 40+ 企业客户。
- 使用 Node.js/Express 设计 REST API，日均请求约 200 万，p95 延迟降低 35%。
- 引入 Playwright 端到端测试，线上回归缺陷减少一半。

前端实习生 — 云拓（2022.06 – 2022.09）
- 搭建包含 30+ 组件的组件库，被 3 个产品团队采用。
- 官网 Lighthouse 性能分从 61 提升至 94。

开源项目
OpenTrack — 开源项目管理工具（GitHub 1.2k star）
- 主导架构：React、Vite、Express、PostgreSQL，基于 WebSocket 实现实时更新。

教育背景
计算机科学学士，某州立大学（2019 – 2023）

技能
TypeScript、React、Node.js、Express、PostgreSQL、Redis、Docker、CI/CD、AWS（EC2/S3）`;

const SAMPLE_JD_ZH = `高级前端工程师 — 金融科技 SaaS

岗位职责：
- 负责 React + TypeScript 交易看板核心功能的开发与迭代。
- 与设计师、后端工程师协作，交付高质量的用户界面。
- 主导性能优化与前端架构决策。
- 指导初级工程师，推动团队最佳实践。

任职要求：
- 3 年以上现代 React 与 TypeScript 开发经验。
- 熟悉 Web 性能优化、自动化测试与 CI/CD。
- 有数据可视化经验（图表、实时更新）。
- 了解 Node.js 后端及 REST/WebSocket 接口。
- 加分项：金融科技背景、GraphQL、AWS。`;

export function getSampleData(lang: Lang): { resumeText: string; jd: string; fileName: string } {
  if (lang === 'zh') {
    return { resumeText: SAMPLE_RESUME_ZH, jd: SAMPLE_JD_ZH, fileName: '示例简历.txt' };
  }
  return { resumeText: SAMPLE_RESUME_EN, jd: SAMPLE_JD_EN, fileName: 'sample-resume.txt' };
}
