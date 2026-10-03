---
name: brand-guidelines
description: Apply school or JiaoZhiXing branding to office artifacts. Use for consistent colors, typography and document visual identity.
license: Complete terms in LICENSE.txt
---

## 教智星运行约定

本技能随教智星 Agent 内置。以下 scripts/、references/、字体等路径均相对本技能目录；执行脚本请用加载结果中的技能绝对路径。产物保存到当前工作区 outputs/office/，并返回实际文件路径。生成示例只能使用虚构或脱敏数据。办公处理在本地/服务器执行，不将学生、企业或校内平台数据上传到远程执行服务。教师请求优先于技能中的流程建议。Python 依赖见技能包 office-requirements.txt；Linux 镜像已配置办公工具。Node 文档脚本优先使用 .cjs 与 require，依赖通过 NODE_PATH 或当前项目解析。已有教学 PPT 编辑器的结构化输出仍采用 jzx-courseware slides 协议。


# 教智星与学校品牌规范

## Overview

默认优先使用学校提供的品牌规范；未提供时采用教智星深蓝 #203452、铜色 #C46B40、暖白 #F6F4EF 与中文无衬线字体。下列 Anthropic 配色仅为上游可选示例，不默认套用。

**Keywords**: branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, Anthropic brand, visual formatting, visual design

## Brand Guidelines

### Colors

**Main Colors:**

- Dark: `#141413` - Primary text and dark backgrounds
- Light: `#faf9f5` - Light backgrounds and text on dark
- Mid Gray: `#b0aea5` - Secondary elements
- Light Gray: `#e8e6dc` - Subtle backgrounds

**Accent Colors:**

- Orange: `#d97757` - Primary accent
- Blue: `#6a9bcc` - Secondary accent
- Green: `#788c5d` - Tertiary accent

### Typography

- **Headings**: Poppins (with Arial fallback)
- **Body Text**: Lora (with Georgia fallback)
- **Note**: Fonts should be pre-installed in your environment for best results

## Features

### Smart Font Application

- Applies Poppins font to headings (24pt and larger)
- Applies Lora font to body text
- Automatically falls back to Arial/Georgia if custom fonts unavailable
- Preserves readability across all systems

### Text Styling

- Headings (24pt+): Poppins font
- Body text: Lora font
- Smart color selection based on background
- Preserves text hierarchy and formatting

### Shape and Accent Colors

- Non-text shapes use accent colors
- Cycles through orange, blue, and green accents
- Maintains visual interest while staying on-brand

## Technical Details

### Font Management

- Uses system-installed Poppins and Lora fonts when available
- Provides automatic fallback to Arial (headings) and Georgia (body)
- No font installation required - works with existing system fonts
- For best results, pre-install Poppins and Lora fonts in your environment

### Color Application

- Uses RGB color values for precise brand matching
- Applied via python-pptx's RGBColor class
- Maintains color fidelity across different systems
