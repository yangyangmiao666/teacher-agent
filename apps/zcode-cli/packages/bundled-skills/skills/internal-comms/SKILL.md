---
name: internal-comms
description: A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write some sort of internal communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident reports, project updates, etc.).
license: Complete terms in LICENSE.txt
---

## 教智星运行约定

本技能随教智星 Agent 内置。以下 scripts/、references/、字体等路径均相对本技能目录；执行脚本请用加载结果中的技能绝对路径。产物保存到当前工作区 outputs/office/，并返回实际文件路径。生成示例只能使用虚构或脱敏数据。办公处理在本地/服务器执行，不将学生、企业或校内平台数据上传到远程执行服务。教师请求优先于技能中的流程建议。Python 依赖见技能包 office-requirements.txt；Linux 镜像已配置办公工具。Node 文档脚本优先使用 .cjs 与 require，依赖通过 NODE_PATH 或当前项目解析。已有教学 PPT 编辑器的结构化输出仍采用 jzx-courseware slides 协议。


## When to use this skill
To write internal communications, use this skill for:
- 3P updates (Progress, Plans, Problems)
- Company newsletters
- FAQ responses
- Status reports
- Leadership updates
- Project updates
- Incident reports

## How to use this skill

To write any internal communication:

1. **Identify the communication type** from the request
2. **Load the appropriate guideline file** from the `examples/` directory:
    - `examples/3p-updates.md` - For Progress/Plans/Problems team updates
    - `examples/company-newsletter.md` - For company-wide newsletters
    - `examples/faq-answers.md` - For answering frequently asked questions
    - `examples/general-comms.md` - For anything else that doesn't explicitly match one of the above
3. **Follow the specific instructions** in that file for formatting, tone, and content gathering

If the communication type doesn't match any existing guideline, ask for clarification or more context about the desired format.

## Keywords
3P updates, company newsletter, company comms, weekly update, faqs, common questions, updates, internal comms
