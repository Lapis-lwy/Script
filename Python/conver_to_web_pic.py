from PIL import Image
import os

# 转换图片为 WebP 格式
def convert_to_webp(image_path, output_folder, max_pixels=178956970):
    try:
        with Image.open(image_path) as img:
            # Check image size
            width, height = img.size
            if width * height > max_pixels:
                print(f"Skipping {image_path} because it exceeds the size limit.")
                return
            # Save the image as WebP
            output_path = os.path.join(output_folder, os.path.splitext(os.path.basename(image_path))[0] + ".webp")
            img.save(output_path, "webp")
    except Exception as e:
        print(f"Failed to convert {image_path}: {e}")

# 遍历文件夹中的图片
def process_images(input_folder, output_folder):
    for filename in os.listdir(input_folder):
        if os.path.exists(os.path.join(output_folder, os.path.splitext(filename)[0] + ".webp")):
            continue
        if filename.endswith(('.jpg', '.jpeg', '.png','.jfif',".webp")):
            image_path = os.path.join(input_folder, filename)
            try:
                convert_to_webp(image_path, output_folder)
            except Exception as e:
                print(f"Error processing {image_path}: {e}. Skipping this image.")

# 指定输入和输出文件夹
input_folder_pc = "/vol3/1000/Image/pc"
input_folder_mobile = "/vol3/1000/Image/mobile"
output_folder_pc = "/vol3/1000/Image/web-pc"
output_folder_mobile = "/vol3/1000/Image/web-mobile"

# 执行转换
process_images(input_folder_pc+"/Normal", output_folder_pc+"/Normal")
process_images(input_folder_mobile+"/Normal", output_folder_mobile+"/Normal")
process_images(input_folder_pc+"/R-18", output_folder_pc+"/R-18")
process_images(input_folder_mobile+"/R-18", output_folder_mobile+"/R-18")
