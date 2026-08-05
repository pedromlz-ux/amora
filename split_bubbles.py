from PIL import Image

def process_image():
    img = Image.open('public/images/bg-bolhas-4.png').convert("RGBA")
    data = img.getdata()
    new_data = []
    
    # Make white (and near white) transparent
    for item in data:
        # Check if pixel is close to white
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    w, h = img.size
    # Crop into 4 quadrants
    tl = img.crop((0, 0, w//2, h//2))
    tr = img.crop((w//2, 0, w, h//2))
    bl = img.crop((0, h//2, w//2, h))
    br = img.crop((w//2, h//2, w, h))
    
    tl.save('public/images/bubble-tl.png')
    tr.save('public/images/bubble-tr.png')
    bl.save('public/images/bubble-bl.png')
    br.save('public/images/bubble-br.png')

process_image()
print("Done")
