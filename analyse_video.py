import os
import json
import sys
import base64
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def analyze_video_official(video_path):
    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv("DASHSCOPE_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    model_name = os.getenv("MODEL_NAME", "qwen-vl-plus")

    if not api_key:
        return {"success": False, "error": "请在 .env 中设置 DASHSCOPE_API_KEY"}

    # 检查本地文件是否存在
    if not os.path.exists(video_path):
        return {"success": False, "error": f"找不到本地文件: {video_path}"}

    # 读取视频并转为 Base64
    try:
        with open(video_path, "rb") as video_file:
            base64_video = base64.b64encode(video_file.read()).decode('utf-8')
    except Exception as e:
        return {"success": False, "error": f"读取视频失败: {str(e)}"}

    client = OpenAI(api_key=api_key, base_url=base_url)

    system_prompt = """🤖 Fingertip Wave AI Engine - System Prompt (动作解读标准版)<br/>[角色定义] 你是一个高精度的短视频动作解析引擎。你的任务是分析 30 秒以内的手势舞视频，将其像素级动作转化为结构化的、带有语义标注的动作剧本。<br/><br/>[核心解析任务]<br/><br/>动作定位：识别动作发生的精确起始时间点。<br/><br/>语义归一化：将复杂的肢体动作映射到下述指定的参考动作范围内。<br/><br/>强度评估：根据动作的速度和幅度给出能量值。<br/><br/>[参考动作范围 (Action Scope)] 请务必从以下类别中选择最接近的项作为 action_tag 的值，严禁自创不相关的标签：<br/><br/>POINT: 指向性动作（上、下、左、右、屏幕）。<br/><br/>PUSH/PULL: 手掌向外推或向内拉。<br/><br/>SWIPE: 手部水平或垂直的快速扫动/切割动作。<br/><br/>WAVE/ROLL: 手臂或手指呈现流线型、波浪状的连续起伏。<br/><br/>CLAP/PUNCH: 击掌、拍手、出拳或瞬时爆发动作。<br/><br/>HEART: 各类比心手势（单手、双手、指尖）。<br/><br/>FRAME: 手指成框、托腮、遮脸等构图类动作。<br/><br/>SPIN/CIRCLE: 绕手、转圈或画圆动作。<br/><br/>GREET: 招手、摆手。<br/><br/>[输出 JSON 结构要求] 必须且仅输出标准的 JSON 数组，格式如下：<br/><br/>JSON<br/><br/>[<br/>  {<br/>    "id": 序号,<br/>    "timestamp": "mm:ss.ms",<br/>    "action_tag": "必须源自上述参考范围",<br/>    "description": "2-6字神韵描述（如：能量爆发击掌、轻盈流线波浪）",<br/>    "intensity": 1-10的整数分值,<br/>    "rhythm_point": true/false (是否为明显的卡点或重拍)<br/>  }<br/>]<br/>[解析约束]<br/><br/>时长限制：仅解析视频的前 30 秒。<br/><br/>语义优先：如果一个动作属于复合动作，请提取其最核心的意图。<br/><br/>语言：description 字段使用中文，体现动作的动态美。"""

    try:
        # 删除 print 语句，确保纯净的 JSON 输出
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "video_url",
                            # 注意：Base64 格式在 video_url 中使用 data 协议
                            "video_url": {"url": f"data:video/mp4;base64,{base64_video}"},
                            "fps": 1 
                        },
                        {"type": "text", "text": "请解析这段手势舞视频的动作序列。"}
                    ]
                }
            ],
        )
        
        raw_content = completion.choices[0].message.content
        
        # 提取 JSON
        clean_content = raw_content
        if "```json" in raw_content:
            clean_content = raw_content.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_content:
            clean_content = raw_content.split("```")[1].split("```")[0].strip()
            
        # 验证 JSON 是否有效
        parsed_data = json.loads(clean_content)
        
        # 确保返回的数据结构正确
        return {
            "success": True,
            "data": parsed_data
        }
    except json.JSONDecodeError as e:
        # JSON 解析错误，输出到 stderr 而不是 stdout
        error_msg = f"JSON 解析失败: {str(e)}"
        print(error_msg, file=sys.stderr)
        return {"success": False, "error": error_msg}
    except Exception as e:
        # 其他错误，输出到 stderr
        error_msg = str(e)
        print(error_msg, file=sys.stderr)
        return {"success": False, "error": error_msg}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "请提供本地视频路径"}, ensure_ascii=False))
        sys.exit(1)

    video_input = sys.argv[1]
    result = analyze_video_official(video_input)
    
    # 确保只输出单行 JSON，不使用 indent 避免多行输出问题
    # 所有错误信息已输出到 stderr，这里只输出 JSON 到 stdout
    json_output = json.dumps(result, ensure_ascii=False)
    print(json_output, file=sys.stdout)
    sys.stdout.flush()  # 确保输出立即刷新