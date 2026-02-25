import re
import sys
import os

def add_comments_to_js(input_file, output_file=None):
    # 如果没有指定输出文件，则在原文件名后加 _commented
    if output_file is None:
        filename, ext = os.path.splitext(input_file)
        output_file = f"{filename}_commented{ext}"

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"错误: 找不到文件 '{input_file}'")
        return
    except Exception as e:
        print(f"读取文件时发生错误: {e}")
        return

    # 正则表达式：匹配 <script...> 和 </script>
    # 使用 re.IGNORECASE 忽略大小写
    script_start_pattern = re.compile(r'<script.*?>', re.IGNORECASE)
    script_end_pattern = re.compile(r'</script>', re.IGNORECASE)

    new_lines = []
    in_script_block = False

    for line in lines:
        # 去除行尾换行符以便处理，最后再加回来
        original_line_content = line.rstrip('\n')
        
        # 检测是否包含 <script> 开始标签
        has_start = script_start_pattern.search(original_line_content)
        # 检测是否包含 </script> 结束标签
        has_end = script_end_pattern.search(original_line_content)

        if has_start:
            # 进入 JS 块
            in_script_block = True
            # 如果同一行既有开始又有结束（单行脚本），则视为立即结束，且不处理该行
            # 因为如果在单行脚本末尾加 // 会注释掉 </script> 导致 HTML 错误
            if has_end:
                in_script_block = False
            
            new_lines.append(original_line_content + '\n')
            continue

        if has_end:
            # 遇到结束标签，退出 JS 块
            in_script_block = False
            new_lines.append(original_line_content + '\n')
            continue

        # 如果当前处于 Script 块内部
        if in_script_block:
            # 检查是否为空行（仅包含空白字符）
            if original_line_content.strip():
                # 在行尾添加 //
                # 注意：这里直接添加在行尾。如果原行尾有分号，会在分号后添加。
                new_lines.append(f"{original_line_content} //\n")
            else:
                # 保持空行原样
                new_lines.append(original_line_content + '\n')
        else:
            # 非 JS 部分（HTML 或 CSS），保持原样
            new_lines.append(original_line_content + '\n')

    # 写入新文件
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"处理完成！已生成文件: {output_file}")
    except Exception as e:
        print(f"写入文件时发生错误: {e}")

if __name__ == "__main__":
    # 使用方法：python script.py <你的文件名>
    if len(sys.argv) < 2:
        print("使用方法: python add_comments.py <目标文件路径>")
    else:
        input_path = sys.argv[1]
        add_comments_to_js(input_path)