---
title: 语法测试
description: 复刻智教联盟论坛「帖子编辑指南」中的 BBCode 语法，用于验证 md-bbcode 插件的渲染效果
---

# BBCode 语法测试

本页面复刻了 [智教联盟论坛 - 帖子编辑指南](https://forum.smart-teach.cn/d/27-tie-zi-bian-ji-zhi-nan) 中提到的全部 BBCode 语法，用于验证本站 `md-bbcode` 插件的渲染效果。每个示例都给出**源码**与**渲染效果**。

::: tip 说明
本页所列语法均可直接用于本站任意文章的 Markdown 正文中。
:::

## 文本相关

### 居中 `[center]`

源码：

```text
[center]居中文本[/center]
```

效果：

[center]居中文本[/center]

### 行内文本格式

源码：

```text
[b]加粗文本[/b]
[i]斜体文本[/i]
[s]删除线文本[/s]
[del]del 删除线文本[/del]
[color=red]颜色文本（red）[/color]
[size=20]大小文本（20px）[/size]
```

效果：

[b]加粗文本[/b] · [i]斜体文本[/i] · [s]删除线文本[/s] · [del]del 删除线文本[/del] · [color=red]颜色文本（red）[/color] · [size=20]大小文本（20px）[/size]

行内 BBCode 支持嵌套与混合 Markdown：

```text
[b]加粗 + [i]斜体嵌套[/i][/b]，还有 [color=blue]*Markdown 斜体*[/color]
```

效果：

[b]加粗 + [i]斜体嵌套[/i][/b]，还有 [color=blue]*Markdown 斜体*[/color]

### 链接与邮箱

源码：

```text
[url=https://example.com/]示例网址[/url]
[email]no@thankyou.com[/email]
```

效果：

[url=https://example.com/]示例网址[/url] · [email]no@thankyou.com[/email]

## 引用

### BBCode 引用 `[quote=作者]`

源码：

```text
[quote=BBcode引用]这里是被引用的内容，支持 **Markdown** 与 [b]BBCode[/b][/quote]
```

效果：

[quote=BBcode引用]这里是被引用的内容，支持 **Markdown** 与 [b]BBCode[/b][/quote]

### Markdown 引用（原生支持）

源码：

```text
> Markdown引用
```

效果：

> Markdown引用

## 警告框

### A 系（预设配色）

源码：

```text
[AWARNING]这是一条严重警告！[/AWARNING]
[ASUCCESS]这是一条成功警告！[/ASUCCESS]
[AINFO]这是一条一般警告。[/AINFO]
[ABASIC]这是一条基本警告。[/ABASIC]
[ACUSTOM]red,black,green,这是一条自定义颜色警告！[/ACUSTOM]
```

效果：

[AWARNING]这是一条严重警告！[/AWARNING]

[ASUCCESS]这是一条成功警告！[/ASUCCESS]

[AINFO]这是一条一般警告。[/AINFO]

[ABASIC]这是一条基本警告。[/ABASIC]

[ACUSTOM]red,black,green,这是一条自定义颜色警告！[/ACUSTOM]

> `[ACUSTOM]` 内容格式：`字体色,背景色,边框色,正文内容`（逗号分隔，颜色可用任意 CSS 颜色）。

### B 系（带大写标题）

源码：

```text
[BWARNING]这是一条警告！[/BWARNING]
[BSUCCESS]这是一条成功！[/BSUCCESS]
[BERROR]这是一条错误！[/BERROR]
[BCUSTOM]title=自定义标题 font=red bg=black border=green[/BCUSTOM]
```

效果：

[BWARNING]这是一条警告！[/BWARNING]

[BSUCCESS]这是一条成功！[/BSUCCESS]

[BERROR]这是一条错误！[/BERROR]

[BCUSTOM]title=自定义标题 font=red bg=black border=green[/BCUSTOM]

> `[BCUSTOM]` 内容格式：`title=标题 font=字体色 bg=背景色 border=边框色`（空格分隔，标题可含空格）。

### C 系（颜色在内容中）

源码：

```text
[CSUCCESS]green,white,green,【CSUCCESS 警告框】标题,消息。[/CSUCCESS]
[CNOTICE]teal,white,teal,【CNOTICE 警告框】标题,消息。[/CNOTICE]
[CWARNING]darkorange,white,darkorange,【CWARNING 警告框】标题,消息。[/CWARNING]
[CERROR]red,white,red,【CERROR 警告框】标题,消息。[/CERROR]
```

效果：

[CSUCCESS]green,white,green,【CSUCCESS 警告框】标题,消息。[/CSUCCESS]

[CNOTICE]teal,white,teal,【CNOTICE 警告框】标题,消息。[/CNOTICE]

[CWARNING]darkorange,white,darkorange,【CWARNING 警告框】标题,消息。[/CWARNING]

[CERROR]red,white,red,【CERROR 警告框】标题,消息。[/CERROR]

> C 系内容格式：`字体色,背景色,边框色,标题,消息`（逗号分隔）。

### D 系（颜色在标签属性中）

源码：

```text
[DSUCCESS title="【DSUCCESS 警告框】标题" font="green" bg="white" border="green"]消息[/DSUCCESS]
[DNOTICE title="【DNOTICE 警告框】标题" font="teal" bg="white" border="teal"]消息[/DNOTICE]
[DWARNING title="【DWARNING 警告框】标题" font="darkorange" bg="white" border="darkorange"]消息[/DWARNING]
[DERROR title="【DERROR 警告框】标题" font="red" bg="white" border="red"]消息[/DERROR]
```

效果：

[DSUCCESS title="【DSUCCESS 警告框】标题" font="green" bg="white" border="green"]消息[/DSUCCESS]

[DNOTICE title="【DNOTICE 警告框】标题" font="teal" bg="white" border="teal"]消息[/DNOTICE]

[DWARNING title="【DWARNING 警告框】标题" font="darkorange" bg="white" border="darkorange"]消息[/DWARNING]

[DERROR title="【DERROR 警告框】标题" font="red" bg="white" border="red"]消息[/DERROR]

## 网盘链接 `[cloud]`

源码：

```text
[cloud type=lz title=测试蓝奏云 url=https://jizilin2021.lanzoue.com/i7RYX2nahq3c]密码[/cloud]
[cloud type=github title=Classisland url=https://github.com/ClassIsland/ClassIsland/releases/tag/1.5.0.4]1.5.0.4[/cloud]
[cloud type=bd title=百度网盘示例 url=https://pan.baidu.com/s/xxxxx]8a8f[/cloud]
```

效果：

[cloud type=lz title=测试蓝奏云 url=https://jizilin2021.lanzoue.com/i7RYX2nahq3c]密码[/cloud]

[cloud type=github title=Classisland url=https://github.com/ClassIsland/ClassIsland/releases/tag/1.5.0.4]1.5.0.4[/cloud]

[cloud type=bd title=百度网盘示例 url=https://pan.baidu.com/s/xxxxx]8a8f[/cloud]

### 支持的网盘类型

`[cloud type=网盘类型 title=标题 url=链接]提取码[/cloud]`，`type` 取值如下：

| type | 网盘 |
| ---- | ---- |
| `123` | 123云盘 |
| `lz` | 蓝奏云 |
| `ali` | 阿里云盘 |
| `bd` | 百度网盘 |
| `tx` | 腾讯微云 |
| `one` | OneDrive |
| `mega` | MEGA |
| `dropbox` | Dropbox |
| `mediafire` | MediaFire |
| `google` | Google Drive |
| `github` | GitHub |
| `gitee` | Gitee |
| `360` | 360云盘 |
| `ty` | 天翼云盘 |
| `ct` | 中国移动云盘 |

各类型效果示例：

[cloud type=123 title=123云盘 url=https://www.123pan.com/s/xxxx]abc123[/cloud]

[cloud type=ali title=阿里云盘 url=https://www.alipan.com/s/xxxx]abc456[/cloud]

[cloud type=tx title=腾讯微云 url=https://share.weiyun.com/xxxx]abc789[/cloud]

[cloud type=one title=OneDrive url=https://1drv.ms/f/xxxx]onedrive[/cloud]

[cloud type=mega title=MEGA url=https://mega.nz/folder/xxxx]mega00[/cloud]

[cloud type=dropbox title=Dropbox url=https://www.dropbox.com/scl/fo/xxxx]dropbox[/cloud]

[cloud type=mediafire title=MediaFire url=https://www.mediafire.com/folder/xxxx]mediafire[/cloud]

[cloud type=google title=Google Drive url=https://drive.google.com/drive/folders/xxxx]google00[/cloud]

[cloud type=gitee title=Gitee 示例 url=https://gitee.com/xxxx]gitee00[/cloud]

[cloud type=360 title=360云盘 url=https://yunpan.360.cn/surl/xxxx]360000[/cloud]

[cloud type=ty title=天翼云盘 url=https://cloud.189.cn/t/xxxx]ty9999[/cloud]

[cloud type=ct title=中国移动云盘 url=https://caiyun.139.com/i/xxxx]ct9999[/cloud]

## 列表 `[list]`

源码：

```text
[list]
[*]列表项目 1 点击输入文本
[*]列表项目 2 不支持 BBCode 有序列表
[/list]
```

效果：

[list]
[*]列表项目 1 点击输入文本
[*]列表项目 2 不支持 BBCode 有序列表
[/list]

> 与论坛一致，`[list]` 仅支持无序列表（有序列表请使用 Markdown 原生 `1. 2.` 语法）。

## 图片 `[upl-image-preview]`

论坛上传图片后插入的是 `fof/upload` 扩展的图片预览标签，属于**自闭合**标签（没有 `[/upl-image-preview]`）：

```text
[upl-image-preview uuid=文件标识 url=原图地址 alt=替代文字 thumbnail_url=缩略图地址]
```

| 属性 | 说明 |
| --- | --- |
| `uuid` | 论坛文件标识，渲染为 `data-uuid`，本站不参与显示 |
| `url` | 原图地址，作为外层链接的 `href`（点击查看原图） |
| `alt` | 替代文字；论坛未填写时会留下 `{TEXT?}` 占位符，本站按空值处理 |
| `thumbnail_url` | 缩略图地址，作为 `img` 的 `src`；缺省时回退为 `url` |
| `width` / `height` | 可选，仅接受纯数字（像素），用于预留尺寸避免布局抖动 |

标签**独占一行**时渲染为居中的块级图片：

源码：

```text
[upl-image-preview uuid=1ba89464-1b04-4a9e-8f11-9b1449c442a1 url=https://forum.smart-teach.cn/assets/files/2026-08-30/1788086839-704023-image.png alt=示例截图]
```

效果：

[upl-image-preview uuid=1ba89464-1b04-4a9e-8f11-9b1449c442a1 url=https://forum.smart-teach.cn/assets/files/2026-08-30/1788086839-704023-image.png alt=示例截图]

夹在文字中间时按行内图片渲染，高度跟随行高：

源码：

```text
这是一个行内图片 [upl-image-preview uuid=1ba89464-1b04-4a9e-8f11-9b1449c442a1 url=https://forum.smart-teach.cn/assets/files/2026-08-30/1788086839-704023-image.png alt=行内示例] 后面继续写文字。
```

效果：

这是一个行内图片 [upl-image-preview uuid=1ba89464-1b04-4a9e-8f11-9b1449c442a1 url=https://forum.smart-teach.cn/assets/files/2026-08-30/1788086839-704023-image.png alt=行内示例] 后面继续写文字。

也可以嵌在引用或警告框内：

[AINFO]
[upl-image-preview uuid=1ba89464-1b04-4a9e-8f11-9b1449c442a1 url=https://forum.smart-teach.cn/assets/files/2026-08-30/1788086839-704023-image.png alt=警告框内的图片]
框内图片会自动收窄上下间距。
[/AINFO]

标签独占一行即成块，**无需**与上一行空行分隔：

上一行是普通文字，紧接着就是图片。
[upl-image-preview uuid=1ba89464-1b04-4a9e-8f11-9b1449c442a1 url=https://forum.smart-teach.cn/assets/files/2026-08-30/1788086839-704023-image.png alt=紧跟文字行的图片]

::: tip 与 Markdown 原生图片的关系
本站文章推荐直接使用 Markdown 的 `![替代文字](地址)`；`[upl-image-preview]` 的价值在于从论坛复制帖子内容时**无需手工改写**即可正确渲染。两者都会自动带上 `loading="lazy"`。
:::

## 嵌入资源

论坛支持虾米音乐、Niconico、ACFUN、网易云音乐、B 站等平台的嵌入。本站为 VitePress 静态站点，可直接使用原生 HTML（`iframe`）嵌入，例如 B 站：

```html
<iframe src="//player.bilibili.com/player.html?bvid=BV1GJ411x7h7&autoplay=0"
        scrolling="no" border="0" frameborder="no" framespacing="0"
        style="width:100%;height:480px;max-width:100%;border-radius:6px;"></iframe>
```

## 已知限制

- 行内 BBCode 需在**同一行**内闭合（`[b]加粗[/b]`），跨行的行内标签不会生效；
- `[list]` 仅支持无序列表；
- 同一标签不支持自嵌套（如 `[b]a[b]b[/b]c[/b]`），嵌套使用不同标签则没问题；
- `[upl-image-preview]` 独占一行时渲染为块级图片（无需与上一行空行分隔），出现在文字中间时渲染为行内图片。

## LaTeX 数学公式

由 [MathJax 3](https://www.mathjax.org/) 在**构建期**渲染为内联 SVG，浏览器端零运行时开销，字形使用 `currentColor`，因此颜色自动跟随正文并适配亮 / 暗色模式。

### 行内公式 `$...$`

源码：

```text
勾股定理 $a^2 + b^2 = c^2$ 是平面几何的基础结论。
质能方程写作 $E = mc^2$。
```

效果：

勾股定理 $a^2 + b^2 = c^2$ 是平面几何的基础结论。
质能方程写作 $E = mc^2$。

::: warning 注意
`$` 定界符的判定规则：开定界符右侧、闭定界符左侧都不能是空白，闭定界符右侧不能紧跟数字。因此像 `100 $ 与 200 $` 这样两侧带空格的写法不会被识别为公式；若需要输出紧贴文字的字面 `$`，请转义为 `\$`。
:::

### 块级公式 `$$...$$`

源码：

```text
$$
\int_0^1 x^2 \,\mathrm{d}x = \frac{1}{3}
$$
```

效果：

$$
\int_0^1 x^2 \,\mathrm{d}x = \frac{1}{3}
$$

### 常用结构

源码：

```text
$$
\begin{aligned}
  \nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
  \nabla \cdot \mathbf{B} &= 0 \\
  \nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
  \nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$
```

效果：

$$
\begin{aligned}
  \nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
  \nabla \cdot \mathbf{B} &= 0 \\
  \nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
  \nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

矩阵与分段函数：

$$
A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
\qquad
\operatorname{sgn}(x) = \begin{cases}
  1, & x > 0 \\
  0, & x = 0 \\
  -1, & x < 0
\end{cases}
$$

超宽公式在窄屏下会横向滚动而非溢出容器：

$$
\sum_{k=0}^{n} \binom{n}{k} x^k y^{n-k} = (x + y)^n \quad\text{且}\quad \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^{n} = e \quad\text{以及}\quad \zeta(s) = \prod_{p \in \mathbb{P}} \frac{1}{1 - p^{-s}}
$$

### 预置宏

在 `docs/.vitepress/config.mjs` 的 `markdown.math.tex.macros` 中集中定义，正文可直接使用：

| 宏 | 展开 | 效果 |
| --- | --- | --- |
| `\RR` | `\mathbb{R}` | $\RR$ |
| `\NN` | `\mathbb{N}` | $\NN$ |
| `\ZZ` | `\mathbb{Z}` | $\ZZ$ |
| `\dd` | `\mathrm{d}` | $\dd$ |

源码：

```text
对任意 $x \in \RR$ 与 $n \in \NN$，有 $\int f(x)\, \dd x$。
```

效果：

对任意 $x \in \RR$ 与 $n \in \NN$，有 $\int f(x)\, \dd x$。

### 与其他语法共存

公式可以出现在引用、警告框与列表中，行距不会被撑开：

> 引用中的公式：$\varphi = \dfrac{1 + \sqrt{5}}{2}$

[AINFO]内容中的公式：$e^{i\pi} + 1 = 0$[/AINFO]

- 列表项中的行内公式 $\sqrt{2} \approx 1.41421$
- 与 BBCode 混排：[b]加粗[/b]、[color=#7c3aed]着色[/color]、$\log_2 1024 = 10$

