"""Build the original Detour product model and render its lighting reference.

Blender 5.2: blender -b --factory-startup --python design/detour/build_scene.py
"""
import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
photo = bpy.data.images.load(os.path.join(ROOT, "design/detour/pepperoni.jpg"))
crumb = bpy.data.images.load(os.path.join(ROOT, "design/detour/crumb.jpg"))
pixels = list(photo.pixels)
w, h = photo.size


def mat(name, color, roughness=0.5, metallic=0, image=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if image:
        tex = m.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return m


top_material = mat("BakedSurface", (1, 1, 1), 0.52, image=photo)
crumb_material = mat("ThinCrumb", (0.8, 0.6, 0.3), 0.88, image=crumb)


def height(u, v):
    x, y = min(w - 1, int(u * w)), min(h - 1, int(v * h))
    k = (y * w + x) * 4
    r, g, b = pixels[k:k + 3]
    meat = max(0, min(1, (r - g * 1.4) * 4.0))
    edge = min(u, v, 1 - u, 1 - v)
    rim = max(0, 1 - edge / 0.037)
    micro = math.sin(u * 223) * math.cos(v * 197) * 0.002
    return 0.038 + meat * 0.025 + rim * 0.029 + (g - 0.4) * 0.009 + micro


products = []
n = 64
for row in range(3):
    for col in range(3):
        vertices, faces, uv_values, materials = [], [], [], []
        for j in range(n + 1):
            for i in range(n + 1):
                u, v = (col + i / n) / 3, (row + j / n) / 3
                x, y = (i / n - 0.5), (j / n - 0.5)
                # The perimeter has a small baked irregularity, not a perfect box edge.
                if col == 0 and i == 0 or col == 2 and i == n:
                    x += math.sin(v * 110) * 0.002
                if row == 0 and j == 0 or row == 2 and j == n:
                    y += math.sin(u * 130) * 0.002
                vertices.append((x, y, height(u, v)))
                uv_values.append((u, v))
                if i < n and j < n:
                    k = j * (n + 1) + i
                    faces.append((k, k + 1, k + n + 2, k + n + 1))
                    materials.append(0)
        rim = [i for i in range(n + 1)]
        rim += [j * (n + 1) + n for j in range(1, n + 1)]
        rim += [n * (n + 1) + i for i in range(n - 1, -1, -1)]
        rim += [j * (n + 1) for j in range(n - 1, 0, -1)]
        for i, a in enumerate(rim):
            b = rim[(i + 1) % len(rim)]
            p, q = vertices[a], vertices[b]
            k = len(vertices)
            vertices.extend([p, q, (q[0], q[1], -0.012), (p[0], p[1], -0.012)])
            uv_values.extend([(i / 60, 1), ((i + 1) / 60, 1), ((i + 1) / 60, 0), (i / 60, 0)])
            faces.append((k, k + 3, k + 2, k + 1))
            materials.append(1)
        k = len(vertices)
        vertices += [(-.5, -.5, -.012), (.5, -.5, -.012), (.5, .5, -.012), (-.5, .5, -.012)]
        uv_values += [(0, 0), (1, 0), (1, 1), (0, 1)]
        faces.append((k + 3, k + 2, k + 1, k))
        materials.append(1)
        mesh = bpy.data.meshes.new(f"SliceMesh{row * 3 + col}")
        mesh.from_pydata(vertices, [], faces)
        mesh.materials.append(top_material)
        mesh.materials.append(crumb_material)
        uv = mesh.uv_layers.new(name="UVMap")
        for polygon, material in zip(mesh.polygons, materials):
            polygon.material_index = material
            polygon.use_smooth = material == 0
            for loop in polygon.loop_indices:
                uv.data[loop].uv = uv_values[mesh.loops[loop].vertex_index]
        obj = bpy.data.objects.new(f"Slice_{row * 3 + col}", mesh)
        bpy.context.collection.objects.link(obj)
        obj.location = ((col - 1) * 1.003, (row - 1) * 1.003, 0)
        obj["sliceIndex"] = row * 3 + col
        products.append(obj)

# Export only the edible object. The browser owns the camera and architecture.
bpy.ops.object.select_all(action="DESELECT")
for obj in products:
    obj.select_set(True)
bpy.context.view_layer.objects.active = products[0]
bpy.ops.export_scene.gltf(
    filepath=os.path.join(ROOT, "public/models/detour-pizza.glb"),
    export_format="GLB", use_selection=True, export_extras=True,
    export_image_format="JPEG", export_jpeg_quality=90,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_texcoord_quantization=14,
)

red = mat("90 Red", (0.46, 0.002, 0.004), 0.6)
white = mat("Chalk", (0.76, 0.77, 0.75), 0.8)
metal = mat("Brushed Aluminium", (0.66, 0.68, 0.7), 0.3, 0.75)


def block(name, size, location, material, bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    mod = obj.modifiers.new("Soft physical edges", "BEVEL")
    mod.width, mod.segments = bevel, 3
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


block("Ground", (40, 40, 0.1), (0, 0, -0.63), white)
block("Red turn", (3.45, 7, 0.12), (0, -1.9, -0.51), red)
block("Red return", (8, 3.45, 0.12), (2.275, -7.125, -0.51), red)
block("Plinth", (3.35, 3.35, 0.4), (0, 0, -0.27), red)
block("Metal edge", (3.15, 3.15, 0.055), (0, 0, -0.04), metal)


def area(name, location, power, size, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size = power, "DISK", size
    light = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (Vector(target) - light.location).to_track_quat("-Z", "Y").to_euler()


area("Large key", (-4, -3, 7), 650, 5, (0, 0, 0))
area("Edge light", (3, 5, 4), 450, 4, (0, 0, 0))
area("Soft fill", (5, -3, 3), 200, 4, (0, 0, 0))
bpy.context.scene.world.color = (0.15, 0.15, 0.15)
bpy.ops.object.camera_add(location=(4.0, -5.5, 5.5))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0.45)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 45
scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "METAL"
    scene.cycles.device = "GPU"
except Exception:
    scene.cycles.device = "CPU"
scene.render.resolution_x = 1800
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = os.path.join(ROOT, "design/detour/hero-render.png")
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "design/detour/90pizza-detour.blend"))
bpy.ops.render.render(write_still=True)
print("DETOUR_MODEL_AND_RENDER_READY")
