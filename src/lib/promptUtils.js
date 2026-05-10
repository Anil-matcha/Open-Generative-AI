export const ENHANCE_TAGS = {
  quality: ['专业摄影感', '超高细节', '8K 分辨率', '高动态范围', '获奖级质感'],
  lighting: ['电影感布光', '黄金时刻', '戏剧性棚拍光', '柔和漫射光', '霓虹光晕', '体积光束'],
  mood: ['氛围感强', '宁静平和', '史诗感与戏剧张力', '温暖舒适', '黑暗神秘'],
  style: ['写实摄影', '油画风', '水彩风', '数字艺术', '概念设计', '动漫风', '赛博朋克风'],
};

export const QUICK_PROMPTS = [
  { label: '人像', prompt: '专业人像摄影，浅景深，柔和棚拍光，85mm 镜头' },
  { label: '风景', prompt: '震撼风光摄影，黄金时刻，广角构图，戏剧性云层，4K' },
  { label: '产品', prompt: '商业产品摄影，干净白底，棚拍光，专业质感' },
  { label: '奇幻', prompt: '史诗奇幻场景，魔法氛围，体积光，细节丰富，概念设计' },
  { label: '科幻', prompt: '未来感科幻环境，霓虹灯，赛博朋克城市，雨中反光，电影感' },
  { label: '美食', prompt: '专业美食摄影，诱人食欲，暖光，浅景深，杂志编辑风' },
  { label: '建筑', prompt: '建筑摄影，戏剧性角度，干净线条，现代设计，专业质感' },
  { label: '时尚', prompt: '高端时尚大片，前卫造型，棚拍光，Vogue 质感，专业' },
];

export const CAMERA_LABELS = {
    "Modular 8K Digital": "模块化 8K 数字电影机",
    "Full-Frame Cine Digital": "全画幅数字电影机",
    "Grand Format 70mm Film": "70mm 大画幅胶片机",
    "Studio Digital S35": "Super 35 影棚数字机",
    "Classic 16mm Film": "经典 16mm 胶片机",
    "Premium Large Format Digital": "高端大画幅数字电影机"
};

export const LENS_LABELS = {
    "Creative Tilt Lens": "创意移轴镜头",
    "Compact Anamorphic": "紧凑型变形宽银幕镜头",
    "Extreme Macro": "极致微距镜头",
    "70s Cinema Prime": "70 年代电影定焦镜头",
    "Classic Anamorphic": "经典变形宽银幕镜头",
    "Premium Modern Prime": "高端现代定焦镜头",
    "Warm Cinema Prime": "暖调电影定焦镜头",
    "Swirl Bokeh Portrait": "旋涡散景人像镜头",
    "Vintage Prime": "复古定焦镜头",
    "Halation Diffusion": "柔光晕染滤镜",
    "Clinical Sharp Prime": "超锐利临床感定焦镜头"
};

export const CAMERA_MAP = {
    "Modular 8K Digital": "模块化 8K 数字电影机",
    "Full-Frame Cine Digital": "全画幅数字电影机",
    "Grand Format 70mm Film": "70mm 大画幅胶片机",
    "Studio Digital S35": "Super 35 影棚数字机",
    "Classic 16mm Film": "经典 16mm 胶片机",
    "Premium Large Format Digital": "高端大画幅数字电影机"
};

export const LENS_MAP = {
    "Creative Tilt Lens": "创意移轴镜头效果",
    "Compact Anamorphic": "紧凑型变形宽银幕镜头",
    "Extreme Macro": "极致微距镜头",
    "70s Cinema Prime": "70 年代电影定焦镜头",
    "Classic Anamorphic": "经典变形宽银幕镜头",
    "Premium Modern Prime": "高端现代定焦镜头",
    "Warm Cinema Prime": "暖调电影定焦镜头",
    "Swirl Bokeh Portrait": "旋涡散景人像镜头",
    "Vintage Prime": "复古定焦镜头",
    "Halation Diffusion": "光晕扩散滤镜",
    "Clinical Sharp Prime": "超锐利临床感定焦镜头"
};

export const FOCAL_PERSPECTIVE = {
    8: "超广角视角",
    14: "广角视角",
    24: "广角动态视角",
    35: "自然电影视角",
    50: "标准人像视角",
    85: "经典人像视角"
};

export const APERTURE_EFFECT = {
    "f/1.4": "浅景深，柔和虚化",
    "f/4": "均衡景深",
    "f/11": "深焦清晰，前后景都锐利"
};

/**
 * Compiles a cinematic prompt based on camera settings.
 * @param {string} basePrompt 
 * @param {string} camera 
 * @param {string} lens 
 * @param {number} focalLength 
 * @param {string} aperture 
 * @returns {string} The compiled prompt
 */
export function buildNanoBananaPrompt(basePrompt, camera, lens, focalLength, aperture) {
    const cameraDesc = CAMERA_MAP[camera] || camera;
    const lensDesc = LENS_MAP[lens] || lens;
    const perspective = FOCAL_PERSPECTIVE[focalLength] || "";
    const depthEffect = APERTURE_EFFECT[aperture] || "";

    const qualityTags = [
        "专业摄影感",
        "超高细节",
        "8K 分辨率"
    ];

    const parts = [
        basePrompt,
        `使用${cameraDesc}拍摄`,
        `搭配${lensDesc}，焦距 ${focalLength}mm${perspective ? `（${perspective}）` : ''}`,
        `光圈 ${aperture}`,
        depthEffect,
        "电影感布光",
        "自然色彩科学",
        "高动态范围",
        qualityTags.join(", ")
    ];

    return parts.filter(p => p && p.trim() !== "").join(", ");
}
