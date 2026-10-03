---
name: matplotlib-chinese-font
description: Configure Chinese fonts for matplotlib plotting. Use when plotting charts with Chinese characters or getting garbled text.
---

## 教智星运行约定

本技能随教智星 Agent 内置。以下 scripts/、references/、字体等路径均相对本技能目录；执行脚本请用加载结果中的技能绝对路径。产物保存到当前工作区 outputs/office/，并返回实际文件路径。生成示例只能使用虚构或脱敏数据。办公处理在本地/服务器执行，不将学生、企业或校内平台数据上传到远程执行服务。教师请求优先于技能中的流程建议。Python 依赖见技能包 office-requirements.txt；Linux 镜像已配置办公工具。Node 文档脚本优先使用 .cjs 与 require，依赖通过 NODE_PATH 或当前项目解析。已有教学 PPT 编辑器的结构化输出仍采用 jzx-courseware slides 协议。


# Matplotlib 中文字体配置

## 何时使用

- matplotlib 图表中出现中文乱码（显示为方块）
- 需要在图表中使用中文标题、标签、图例
- 需要区分不同中文字体效果（如宋体 vs 黑体）

## 快速配置

### 方法 1：全局配置（推荐）

```python
import matplotlib.pyplot as plt

# 配置中文字体
plt.rcParams['font.sans-serif'] = ['Noto Sans CJK SC', 'Microsoft YaHei', 'Heiti SC', 'Heiti TC']  # 华文黑体
plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题

# 绘制图表
plt.plot([1, 2, 3], [1, 2, 3])
plt.title('测试标题', fontsize=14)
plt.xlabel('X 轴')
plt.ylabel('Y 轴')
plt.show()
```

### 方法 2：强制指定字体（更可靠）

先从实际已安装的字体选择，避免强制使用系统不存在的字体：

```python
from matplotlib import font_manager
available = {item.name for item in font_manager.fontManager.ttflist}
candidates = ['Noto Sans CJK SC', 'Microsoft YaHei', 'Heiti SC', 'Heiti TC']
chinese_font = next((name for name in candidates if name in available), None)
if chinese_font is None:
    raise RuntimeError('请先安装中文字体，例如 fonts-noto-cjk')
```

当全局配置不生效时，在具体元素上强制指定：

```python
plt.title('图表标题', fontsize=14, fontname=chinese_font)
plt.xlabel('X 轴', fontsize=12, fontname='Heiti TC')
plt.ylabel('Y 轴', fontsize=12, fontname='Heiti TC')
plt.text(0.5, 0.5, '文本标注', fontname='Heiti TC')
```

### 可用字体

常用系统字体：
- **Heiti TC** - 华文黑体（用户偏好）
- Songti SC - 华文宋体

查询所有可用字体：
```bash
python3 -c "import matplotlib.font_manager as fm; print('\n'.join(sorted(set([f.name for f in fm.fontManager.ttflist]))))"
```

## 常见问题

### 字体不生效

1. **清除字体缓存**
   ```bash
   rm -rf ~/.matplotlib
   ```
   或运行 `scripts/clear_cache.py`

2. **强制指定字体**
   使用 `fontname` 参数而不是 `rcParams`

3. **检查字体是否存在**
   运行 `scripts/list_fonts.py` 查看系统可用字体

### 负号显示为方块

```python
plt.rcParams['axes.unicode_minus'] = False
```

### 保存图片时中文乱码

确保保存前字体已正确设置：
```python
plt.savefig('/tmp/chart.png', dpi=120, bbox_inches='tight')
```

## 脚本工具

- `scripts/clear_cache.py` - 清除 matplotlib 字体缓存
- `scripts/list_fonts.py` - 列出系统可用中文字体
- `scripts/test_font.py` - 测试指定字体的显示效果

## 参考资料

- `references/troubleshooting.md` - 详细问题排查指南
