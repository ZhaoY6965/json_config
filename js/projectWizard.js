// projectWizard.js — 工程创建向导
// 从0起步的机场灯光配置工程创建流程，按 Phase 0~7 共25个JSON步骤逐步生成
import { showStatus } from './core.js';
import { dialog } from './dialog.js';
import { TEMPLATE_FIELDS, TEMPLATE_DEFAULTS, TEMPLATE_OBJECTS } from './templateFields.js';

// ============================================================
// 步骤定义
// ============================================================

const STEPS = [
    // ===== Phase 0: 基础渲染库 =====
    {
        id: 'basic_shapes',
        phase: 0,
        fileName: 'basic_shapes.json',
        title: 'basic_shapes.json — 基础图形库',
        description: '定义所有基础图形的参数结构，每个形状包含 description、type、defaultParams、paramDescriptions。后续的 lamp_template 将引用这里的 shape 定义。',
        defaultData: {"version":"9.6","description":"基础图形库 - 定义所有基本图形的参数结构。坐标基于数学系（原点 0,0 居中，Y 轴向上为正）。填充/描边/闪烁等外观统一由笔刷(brushes_config.json)驱动，每个 profile 项通过 brushes.{state} 或 brushes.on_N 引用笔刷。","globalParams":{"x":"水平位置偏移（相对原点 0,0，向右为正）","y":"垂直位置偏移（相对原点 0,0，向上为正）","seqIndex":"序列相位序号：-1=不参与轮巡；0,1,2…=相位序号"},"shapes":{"semicircle":{"description":"半圆 - 默认朝向左侧 (startAngle=90, spanAngle=180)","type":"semicircle","defaultParams":{"radius":4,"ArcCut":0,"LineCut":0,"startAngle":90,"spanAngle":180,"rotation":0,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"radius":"半径","ArcCut":"弧形切割：同心环内径","LineCut":"直线切割：垂直于对称轴、距圆心距离","startAngle":"起始角度（度），默认90°使中点朝左","spanAngle":"跨度角度（度），默认180°为半圆","rotation":"额外旋转角度（度）","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}},"circle":{"description":"圆形","type":"circle","defaultParams":{"radius":4,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"radius":"半径","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}},"ellipse":{"description":"椭圆","type":"ellipse","defaultParams":{"rx":5,"ry":3,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"rx":"X轴半径","ry":"Y轴半径","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}},"rect":{"description":"矩形（支持圆角）","type":"rect","defaultParams":{"width":8,"height":6,"rx":0,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"width":"宽度","height":"高度","rx":"圆角半径（0=直角）","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}},"line":{"description":"线段","type":"line","defaultParams":{"x1":-4,"y1":0,"x2":4,"y2":0,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"x1":"起点X","y1":"起点Y","x2":"终点X","y2":"终点Y","x":"整体水平位置偏移","y":"整体垂直位置偏移","seqIndex":"序列相位序号"}},"polygon":{"description":"多边形","type":"polygon","defaultParams":{"points":[[-3,-3],[3,-3],[4,2],[0,5],[-4,2]],"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"points":"顶点坐标数组 [[x1,y1], [x2,y2], ...]","x":"整体水平位置偏移","y":"整体垂直位置偏移","seqIndex":"序列相位序号"}},"arc":{"description":"弧形","type":"arc","defaultParams":{"radius":4,"startAngle":0,"spanAngle":90,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"radius":"半径","startAngle":"起始角度（度）","spanAngle":"跨度角度（度）","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}},"star":{"description":"星形","type":"star","defaultParams":{"outerRadius":5,"innerRadius":2.5,"numPoints":5,"x":0,"y":0,"rotation":0,"seqIndex":-1},"paramDescriptions":{"outerRadius":"外半径","innerRadius":"内半径","numPoints":"星尖数量","x":"水平位置偏移","y":"垂直位置偏移","rotation":"额外旋转角度（度）","seqIndex":"序列相位序号"}},"arrow":{"description":"箭头","type":"arrow","defaultParams":{"x1":-5,"y1":0,"x2":5,"y2":0,"headSize":3,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"x1":"起点X","y1":"起点Y","x2":"终点X","y2":"终点Y","headSize":"箭头大小","x":"整体水平位置偏移","y":"整体垂直位置偏移","seqIndex":"序列相位序号"}},"cross":{"description":"十字形","type":"cross","defaultParams":{"size":4,"width":1.5,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"size":"十字臂长","width":"十字臂宽","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}},"diamond":{"description":"菱形","type":"diamond","defaultParams":{"width":6,"height":6,"x":0,"y":0,"seqIndex":-1},"paramDescriptions":{"width":"宽度","height":"高度","x":"水平位置偏移","y":"垂直位置偏移","seqIndex":"序列相位序号"}}}}
    },
    {
        id: 'brushes_config',
        phase: 0,
        fileName: 'brushes_config.json',
        title: 'brushes_config.json — 笔刷配置',
        description: '定义所有笔刷（颜色+闪烁参数），每个条目包含 fillColor、strokeColor、透明度、闪烁等属性。',
        defaultData: [
            { id: 'brush_red',      fillColor: '#ff0000', strokeColor: '#ec0e24', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_blue',     fillColor: '#4a9bfa', strokeColor: '#2a7ad8', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_white',    fillColor: '#ffffff', strokeColor: '#f0f0f0', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_yellow',   fillColor: '#ffff00', strokeColor: '#d9d902', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_green',    fillColor: '#00ff00', strokeColor: '#34b249', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_off',      fillColor: '#8a8a8f', strokeColor: '#8a8a8f', strokeWidth: 1,   fillOpacity: 1, strokeOpacity: 0.2, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_selected', fillColor: '#ffffff', strokeColor: '#dad8d8', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_alarm',    fillColor: '#800000', strokeColor: '#c10101', strokeWidth: 0.2, fillOpacity: 1, strokeOpacity: 1, blinkEnable: true,  blinkIntervalMs: 700 },
            { id: 'brush_unknown',  fillColor: '#000000', strokeColor: '#000000', strokeWidth: 1,   fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_black',    fillColor: '#000000', strokeColor: '#000000', strokeWidth: 1,   fillOpacity: 1, strokeOpacity: 0.5, blinkEnable: false, blinkIntervalMs: 700 },
            { id: 'brush_silver',   fillColor: '#c0c0c0', strokeColor: '#b1afaf', strokeWidth: 0.1, fillOpacity: 1, strokeOpacity: 1, blinkEnable: false, blinkIntervalMs: 700 }
        ]
    },
    {
        id: 'lamp_model_config',
        phase: 0,
        fileName: 'lamp_model_config.json',
        title: 'lamp_model_config.json — 灯具型号字典',
        description: '定义灯具型号字典，每项包含 id、name、profile（引用 basic_shapes 形状键）、color（颜色分类标识）。',
        defaultData: [
            { id: 'JJD',     name: '进近灯',           profile: 'semicircle', color: 'w' },
            { id: 'HZ_Q_GG', name: '滑行道中线灯双向绿', profile: 'bicircle',  color: 'gg' },
            { id: 'HZ_Q_Y',  name: '滑行道中线灯单向黄', profile: 'semicircle', color: 'y' },
            { id: 'CBD',     name: '侧边灯',            profile: 'semicircle', color: 'r' },
            { id: 'TZP',     name: '停止排灯',           profile: 'semicircle', color: 'r' }
        ]
    },
    {
        id: 'lamp_template',
        phase: 0,
        fileName: 'lamp_template.json',
        title: 'lamp_template.json — 灯具渲染模板',
        description: '为每个灯具型号定义渲染模板，包含形状引用、笔刷映射、位置参数等。将使用灯光图例编辑器展示。',
        defaultData: [
            {
                id: 'HZ_Q_GG', name: '滑行道中线灯双向绿', ctlFaceNum: 2,
                profile: [{
                    ref: 'semicircle',
                    brushes: { on_1: 'brush_green', on_2: 'brush_green', off: 'brush_off', alarm: 'brush_alarm', selected: 'brush_selected', unknown: 'brush_unknown' },
                    params: { radius: 4, ArcCut: 0, LineCut: 0.5, startAngle: 90, spanAngle: 180, rotation: 0, x: 0, y: 0 }
                }]
            }
        ]
    },

    // ===== Phase 1: 站点拓扑 =====
    {
        id: 'site_config',
        phase: 1,
        fileName: 'site_config.json',
        title: 'site_config.json — 站点配置',
        description: '定义站点列表（灯光站/塔台/运管中心）。此id将被 soc_config、ccr_config、circuit_config 引用。',
        defaultData: [
            { id: 'site_1', name: '1#灯光站', type: 0 },
            { id: 'site_2', name: '2#灯光站', type: 0 },
            { id: 'site_3', name: '3#灯光站', type: 0 },
            { id: 'site_4', name: '4#灯光站', type: 0 },
            { id: 'site_5', name: '塔台',     type: 1 },
            { id: 'site_6', name: '运管中心',  type: 2 }
        ]
    },
    {
        id: 'runway_config',
        phase: 1,
        fileName: 'runway_config.json',
        title: 'runway_config.json — 跑道配置',
        description: '定义跑道信息，包含跑道名称、方向编码、亮度等级。',
        defaultData: [
            { id: 'runway_1', name: '北跑道', primary_direction: '07', secondary_direction: '25', primary_levels: '关#1档#2档#3档#4档#5档#I类#II类#', secondary_levels: '关#1档#2档#3档#4档#5档#I类#II类#' }
        ]
    },
    {
        id: 'zone_config',
        phase: 1,
        fileName: 'zone_config.json',
        title: 'zone_config.json — 区域配置',
        description: '按跑道+方向拆分区域。此id将被 ctlauth_config 引用。',
        defaultData: [
            { id: 'zone_rw1_d0', name: '北跑道 公共' },
            { id: 'zone_rw1_d1', name: '北跑道 主方向' },
            { id: 'zone_rw1_d2', name: '北跑道 次方向' },
            { id: 'zone_rw2_d0', name: '南跑道 公共' },
            { id: 'zone_rw2_d1', name: '南跑道 主方向' },
            { id: 'zone_rw2_d2', name: '南跑道 次方向' }
        ]
    },
    {
        id: 'soc_config',
        phase: 1,
        fileName: 'soc_config.json',
        title: 'soc_config.json — SOC控制器配置',
        description: '为每个站点分配SOC控制器（site_1配19台，site_2配18台，site_3配16台，site_4配17台，总计70台）。',
        defaultData: (function() {
            var socs = [];
            var sites = ['site_1','site_2','site_3','site_4'];
            var counts = [19,18,16,17];
            var idx = 1;
            for (var si = 0; si < sites.length; si++) {
                for (var ci = 0; ci < counts[si]; ci++) {
                    socs.push({ id: 'soc_' + idx, name: 'SOC' + idx, site_id: sites[si] });
                    idx++;
                }
            }
            return socs;
        })()
    },

    // ===== Phase 2: 调光器 =====
    {
        id: 'ccr_card_config',
        phase: 2,
        fileName: 'ccr_card_config.json',
        title: 'ccr_card_config.json — 调光器卡片',
        description: '定义CCR物理板卡，一站点一卡片。rows/columns 定义网格尺寸。',
        defaultData: TEMPLATE_DEFAULTS['ccr_card_config'],
        inlineTemplate: true
    },
    {
        id: 'ccr_config',
        phase: 2,
        fileName: 'ccr_config.json',
        title: 'ccr_config.json — 调光器配置',
        description: '定义每个调光器实例，这是核心工作量最大的文件之一。每个调光器关联 SOC 通道和卡片网格位置。',
        defaultData: TEMPLATE_DEFAULTS['ccr_config'],
        inlineTemplate: true
    },

    // ===== Phase 3: 回路 =====
    {
        id: 'circuit_card_config',
        phase: 3,
        fileName: 'circuit_card_config.json',
        title: 'circuit_card_config.json — 回路卡片',
        description: '定义回路分组卡片（用于回路选择面板的布局），包含虚拟网格尺寸和像素位置。',
        defaultData: TEMPLATE_DEFAULTS['circuit_card_config'],
        inlineTemplate: true
    },
    {
        id: 'circuit_group_config',
        phase: 3,
        fileName: 'circuit_group_config.json',
        title: 'circuit_group_config.json — 回路分组',
        description: '按功能把回路分组，决定回路在UI面板上的排列。共24个分组。',
        defaultData: TEMPLATE_DEFAULTS['circuit_group_config'],
        inlineTemplate: true
    },
    {
        id: 'circuit_config',
        phase: 3,
        fileName: 'circuit_config.json',
        title: 'circuit_config.json — 回路配置',
        description: '定义每个回路（灯串），这是条目最多的文件。关联调光器和回路分组。',
        defaultData: TEMPLATE_DEFAULTS['circuit_config'],
        inlineTemplate: true
    },

    // ===== Phase 4: 灯具分布 =====
    {
        id: 'segment_config',
        phase: 4,
        fileName: 'segment_config.json',
        title: 'segment_config.json — 段配置',
        description: '定义段（从回路到灯具的中间层），每个段对应一个物理线段，包含起点终点坐标。',
        defaultData: TEMPLATE_DEFAULTS['segment_config'],
        inlineTemplate: true
    },
    {
        id: 'gsegment_config',
        phase: 4,
        fileName: 'GSegment.json',
        title: 'GSegment.json — 段分组',
        description: '定义段的分组归属。',
        defaultData: TEMPLATE_DEFAULTS['gsegment_config'],
        inlineTemplate: true
    },
    {
        id: 'node_config',
        phase: 4,
        fileName: 'node_config.json',
        title: 'node_config.json — 节点配置',
        description: '定义节点（灯在段上的连接点），关联段、回路、face方向。',
        defaultData: TEMPLATE_DEFAULTS['node_config'],
        inlineTemplate: true
    },
    {
        id: 'single_lamp_config',
        phase: 4,
        fileName: 'single_lamp_config.json',
        title: 'single_lamp_config.json — 单灯配置',
        description: '定义单个灯具实例的位置、角度和模板引用。id 与 node_config 严格一一对应。',
        defaultData: TEMPLATE_DEFAULTS['single_lamp_config'],
        inlineTemplate: true
    },
    {
        id: 'lamp_unit_config',
        phase: 4,
        fileName: 'lamp_unit_config.json',
        title: 'lamp_unit_config.json — 灯具单元',
        description: '定义灯具单元（型号绑定），关联灯型、回路、顺序。',
        defaultData: TEMPLATE_DEFAULTS['lamp_unit_config'],
        inlineTemplate: true
    },

    // ===== Phase 5: 权限 =====
    {
        id: 'ctlauth_config',
        phase: 5,
        fileName: 'ctlauth_config.json',
        title: 'ctlauth_config.json — 控制权限',
        description: '定义区域控制权限，与 zone_config 一一对应。',
        defaultData: TEMPLATE_DEFAULTS['ctlauth_config'],
        inlineTemplate: true
    },

    // ===== Phase 6: 网络 =====
    {
        id: 'tcp_servers',
        phase: 6,
        fileName: 'TcpServers.json',
        title: 'TcpServers.json — TCP服务器配置',
        description: '定义TCP服务器端口和服务地址。',
        defaultData: TEMPLATE_OBJECTS['tcp_servers'],
        inlineTemplate: true
    },
    {
        id: 'workstation_config',
        phase: 6,
        fileName: 'workstation_config.json',
        title: 'workstation_config.json — 工作站配置',
        description: '定义工作站列表。',
        defaultData: TEMPLATE_DEFAULTS['workstation_config'],
        inlineTemplate: true
    },
    {
        id: 'user_config',
        phase: 6,
        fileName: 'user_config.json',
        title: 'user_config.json — 用户配置',
        description: '定义系统用户及其权限。',
        defaultData: TEMPLATE_DEFAULTS['user_config'],
        inlineTemplate: true
    },

    // ===== Phase 7: 渲染 =====
    {
        id: 'render_config',
        phase: 7,
        fileName: 'render_config.json',
        title: 'render_config.json — 渲染配置',
        description: '定义底图、灯位图、回路图、视角的参数。偏移量和缩放需要通过反复试调确定。',
        defaultData: TEMPLATE_OBJECTS['render_config'],
        inlineTemplate: true
    },

    // ===== Phase 8: 应用配置 =====
    {
        id: 'module_config',
        phase: 8,
        fileName: 'module_config.json',
        title: 'module_config.json — 功能模块配置',
        description: '定义 HMI 顶部功能模块（灯光/报警/调光器/网络/数据/单灯/设置/电力/PAPI/IO），每项含 id、name、icon、pageSource、enabled、description。',
        defaultData: TEMPLATE_OBJECTS['module_config'],
        inlineTemplate: true
    },
    {
        id: 'app_config',
        phase: 8,
        fileName: 'app_config.json',
        title: 'app_config.json — 应用全局配置',
        description: '应用级配置：工作站标识、语言列表、配置加载键（ConfigLoadKey，如 XiaMen）、日志参数（LogConf）。',
        defaultData: TEMPLATE_OBJECTS['app_config'],
        inlineTemplate: true
    }
];

// ============================================================
// 表单编辑器
// ============================================================

/** 注册使用表单编辑器的步骤 */
var FORM_EDITORS = {
    'basic_shapes': 'object',
    // 此前已转换为卡片编辑器的 6 个配置
    'brushes_config': 'array',
    'lamp_model_config': 'array',
    'site_config': 'array',
    'runway_config': 'array',
    'zone_config': 'array',
    'soc_config': 'array',
    // 由厦门真实工程配置自动提取「公共扁平字段」生成的卡片编辑器（默认仅 5 组，详见 templateFields.js）
    'ccr_card_config': 'array',
    'ccr_config': 'array',
    'circuit_card_config': 'array',
    'circuit_group_config': 'array',
    'circuit_config': 'array',
    'segment_config': 'array',
    'gsegment_config': 'array',
    'node_config': 'array',
    'single_lamp_config': 'array',
    'lamp_unit_config': 'array',
    'ctlauth_config': 'array',
    'workstation_config': 'array',
    'user_config': 'array',
    // lamp_template 直接关联「灯光图例」编辑器（legend_editor.html），全屏展示该页面，不再显示 JSON 预览
    'lamp_template': 'legend',
    // 以下四个为「对象类型」配置（顶层非数组），采用通用对象编辑器渲染，结构与数组卡片编辑器一致
    'tcp_servers': 'object',
    'render_config': 'object',
    'module_config': 'object',
    'app_config': 'object',
};

/* ============================================================
 * 默认模板加载：真实工程配置（厦门）放在 templates/ 目录，
 * 首次打开某步骤时按需 fetch，缓存后作为该步骤的默认数据。
 * 这样避免把 6MB+ 的 lamp_unit_config 等大文件内联进 JS。
 * ============================================================ */
var TEMPLATE_DIR = 'templates/';
var TEMPLATE_CACHE = {};    // stepId -> 已解析的模板数据（失败则回退为 step.defaultData）
var TEMPLATE_LOADING = {};  // stepId -> true 表示正在请求，避免重复 fetch
// 序列化后超过该字符数的模板不塞入 textarea（防止大 JSON 卡死浏览器），改用摘要卡片
var LARGE_TEMPLATE_CHARS = 200000;

/* 卡片数组编辑器的可变状态：{ data:[...], fields:[...] }，按 step.id 持久，支持新增配置组/字段后保留 */
var wizardEditorState = {};
function ensureWizardEditorState(stepId, baseFields, fallbackData) {
    if (!wizardEditorState[stepId]) {
        var parsed = fallbackData;
        try { parsed = JSON.parse(wizardState.generatedData[stepId]); } catch (e) {}
        if (!Array.isArray(parsed)) parsed = [];
        wizardEditorState[stepId] = {
            data: parsed,
            fields: JSON.parse(JSON.stringify(baseFields))
        };
    }
    return wizardEditorState[stepId];
}

/** 自动检测数组项字段类型 */
function detectArrayFields(item) {
    var fields = [];
    for (var key in item) {
        var val = item[key];
        var type = 'text';
        if (typeof val === 'number') type = 'number';
        else if (typeof val === 'boolean') type = 'boolean';
        else if (typeof val === 'object') type = 'json';
        else if (typeof val === 'string' && /^#[0-9a-f]{3,8}$/i.test(val)) type = 'color';
        fields.push({ key: key, label: key, type: type, readonly: key === 'id' });
    }
    return fields;
}

/* brushes_config 的紧凑卡片式字段定义（颜色字段只显示 JSON 原始内容，不渲染真实颜色） */
var BRUSH_FIELDS = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'fillColor', label: '填充色', type: 'text' },
    { key: 'strokeColor', label: '描边色', type: 'text' },
    { key: 'strokeWidth', label: '描边宽', type: 'number' },
    { key: 'fillOpacity', label: '填充不透明', type: 'number' },
    { key: 'strokeOpacity', label: '描边不透明', type: 'number' },
    { key: 'blinkEnable', label: '闪烁', type: 'boolean' },
    { key: 'blinkIntervalMs', label: '闪烁间隔ms', type: 'number' }
];

/* lamp_model_config 的紧凑卡片字段定义：color 直接显示 JSON 原始内容（短代码） */
var LAMP_MODEL_FIELDS = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: '名称', type: 'text' },
    { key: 'profile', label: '形状键 profile', type: 'text' },
    { key: 'color', label: '颜色分类', type: 'text' }
];

/* site_config 站点配置字段定义 */
var SITE_CONFIG_FIELDS = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: '站点名称', type: 'text' },
    { key: 'type', label: '类型', type: 'number' }
];

/* runway_config 跑道配置字段定义 */
var RUNWAY_CONFIG_FIELDS = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: '跑道名称', type: 'text' },
    { key: 'primary_direction', label: '主方向编码', type: 'text' },
    { key: 'secondary_direction', label: '次方向编码', type: 'text' },
    { key: 'primary_levels', label: '主方向亮度等级', type: 'text' },
    { key: 'secondary_levels', label: '次方向亮度等级', type: 'text' }
];

/* zone_config 区域配置字段定义 */
var ZONE_CONFIG_FIELDS = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: '区域名称', type: 'text' }
];

/* soc_config SOC控制器配置字段定义 */
var SOC_CONFIG_FIELDS = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'name', label: '控制器名称', type: 'text' },
    { key: 'site_id', label: '所属站点', type: 'text' }
];

/** 共享：基于可变 state（data + fields）的紧凑卡片数组编辑器，支持「新增配置组 / 新增字段」 */
function renderCardArrayEditor(container, state, onChange, rerender, opts) {
    var data = state.data;
    var fields = state.fields;
    var html = ''
        + '<div class="wizard-form-toolbar">'
        + '  <button class="btn btn-primary btn-sm add-group-btn" type="button">＋ 批量新增配置组</button>'
        + '  <button class="btn btn-danger btn-sm batch-del-btn" type="button">－ 批量删除配置组</button>'
        + (opts.pageDesign ? '  <button class="btn btn-accent btn-sm page-design-btn" type="button">▦ 页面设计</button>' : '')
        + '  <button class="btn btn-outline btn-sm add-field-btn" type="button">＋ 新增字段</button>'
        + '  <button class="btn btn-outline btn-sm del-field-btn" type="button">－ 删除字段</button>'
        + '  <span class="wizard-form-count">' + data.length + ' 个配置组</span>'
        + '</div>'
        + '<div class="wizard-form ' + (opts.cardsClass || 'brush-cards') + '">';

    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        html += '<div class="brush-card">';
        html += '  <div class="brush-card-head">' + opts.headHtml(item, i)
            + '    <button class="card-del-btn" type="button" data-del-group="' + i + '" title="删除该配置组">×</button>'
            + '  </div>';
        html += '  <div class="brush-card-body">';

        for (var fi = 0; fi < fields.length; fi++) {
            var f = fields[fi];
            if (f.readonly) continue;
            var fv = item[f.key];
            var fvStr = fv !== undefined && fv !== null ? String(fv) : '';

            if (f.type === 'boolean') {
                html += '    <div class="form-group brush-bool-field">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-cb" type="checkbox" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" ' + (fv ? 'checked' : '') + '>';
                html += '    </div>';
            } else if (f.type === 'number') {
                html += '    <div class="form-group">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-input form-input-sm arr-num" type="number" step="any" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" value="' + fv + '">';
                html += '    </div>';
            } else {
                // 文本（含颜色字段）：只显示 JSON 原始内容，不渲染真实颜色
                html += '    <div class="form-group">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-input form-input-sm arr-txt" type="text" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" value="' + escapeHtml(fvStr) + '">';
                html += '    </div>';
            }
        }

        html += '  </div>';
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // 事件只绑定一次（container 在重渲染间复用，避免重复绑定导致多次触发）
    if (!container._wzBound) {
        container._wzBound = true;
        function handleEdit(e) {
            var t = e.target;
            var isEdit = t.classList.contains('arr-num') || t.classList.contains('arr-txt') || t.classList.contains('form-cb');
            if (!isEdit) return;
            var updated = collectArrData(container, state.data, state.fields);
            state.data = updated;
            var cardIdx = +t.dataset.i;
            var card = container.querySelectorAll('.brush-card')[cardIdx];
            if (card) {
                if (t.dataset.fk === 'id') { var idS = card.querySelector('.brush-id'); if (idS) idS.textContent = t.value; }
                var nameS = card.querySelector('.lampmodel-name');
                if (nameS && t.dataset.fk === 'name') nameS.textContent = t.value;
            }
            onChange(updated);
        }
        container.addEventListener('input', handleEdit);
        container.addEventListener('change', handleEdit);
        container.addEventListener('click', async function(e) {
            if (e.target.classList.contains('add-group-btn')) openAddGroupModal(state, rerender, onChange);
            else if (e.target.classList.contains('batch-del-btn')) openBatchDeleteModal(state, rerender, onChange);
            else if (e.target.classList.contains('add-field-btn')) openAddFieldModal(state, rerender, onChange);
            else if (e.target.classList.contains('del-field-btn')) openDeleteFieldModal(state, rerender, onChange);
            else if (e.target.classList.contains('page-design-btn')) openCcrPageDesignModal(state, rerender, onChange);
            else if (e.target.classList.contains('card-del-btn')) {
                var gi = +e.target.getAttribute('data-del-group');
                var g = state.data[gi];
                var gname = g ? (g.id || g.name || ('#' + (gi + 1))) : ('#' + (gi + 1));
                if (await dialog.confirm('确定删除配置组「' + gname + '」？此操作不可撤销。', '删除配置组', true)) {
                    state.data.splice(gi, 1);
                    rerender();
                    onChange(state.data);
                }
            }
        });
    }
}

/** 把数值格式化为字符串：整数不显示小数，去除浮点误差 */
function fmtSerialNum(n) {
    if (!isFinite(n)) return '0';
    if (Math.floor(n) === n) return String(n);
    return String(Math.round(n * 1e6) / 1e6);
}

/** 批量新增配置组：每个字段可单独选择「固定值」或「序列化」（固定内容 + 步进数字，支持「固定内容_+数字」「固定内容+数字」两种），按创建数量批量生成 */
function openAddGroupModal(state, rerender, onChange) {
    var fields = state.fields;
    var editable = fields.filter(function(f) { return !f.readonly; });

    var body = ''
        + '<div class="ag-count-row">'
        + '  <label class="form-label-sm">创建数量</label>'
        + '  <input type="number" min="1" step="1" value="1" class="ag-count form-input form-input-sm">'
        + '  <span class="ag-preview"></span>'
        + '</div>'
        + '<p class="wizard-modal-tip">为每个字段选择取值方式：<b>固定值</b>（所有组相同）或 <b>序列化</b>（固定内容 + 步进数字，支持「固定内容_+数字」与「固定内容+数字」两种）。</p>';

    for (var idx = 0; idx < editable.length; idx++) {
        var f = editable[idx];
        var fid = 'ag' + idx;
        body += '<div class="ag-field" id="agf-' + fid + '">';
        body += '  <div class="ag-field-head">'
              + '    <span class="ag-field-label">' + escapeHtml(f.label) + ' <span class="ag-field-key">(' + escapeHtml(f.key) + ')</span></span>'
              + '    <span class="ag-modes">'
              + '      <label><input type="radio" name="' + fid + '_mode" value="fixed" checked> 固定值</label>';
        if (f.type !== 'boolean') {
            body += '      <label><input type="radio" name="' + fid + '_mode" value="serial"> 序列化</label>';
        }
        body += '    </span>'
              + '  </div>';
        if (f.type === 'boolean') {
            body += '  <div class="ag-fixed"><input type="checkbox" class="' + fid + '_fixed"></div>';
        } else {
            body += '  <div class="ag-fixed"><input type="text" class="' + fid + '_fixed form-input form-input-sm" placeholder="固定值"></div>';
        }
        if (f.type !== 'boolean') {
            body += '  <div class="ag-serial" style="display:none;">';
            if (f.type === 'number') {
                body += '    <span class="ag-serial-note">数值字段仅按「起始 + 步长 × 序号」生成数字：</span>';
            }
            body += '    <span class="ag-serial-item"><span class="ag-serial-t">固定内容</span><input type="text" class="' + fid + '_pre form-input form-input-sm" placeholder="如 SOC"></span>';
            body += '    <span class="ag-serial-item"><span class="ag-serial-t">分隔</span><select class="' + fid + '_sep form-input form-input-sm"><option value="">无</option><option value="_">下划线 _</option></select></span>';
            body += '    <span class="ag-serial-item"><span class="ag-serial-t">起始</span><input type="number" step="any" class="' + fid + '_start form-input form-input-sm" value="1"></span>';
            body += '    <span class="ag-serial-item"><span class="ag-serial-t">步长</span><input type="number" step="any" class="' + fid + '_step form-input form-input-sm" value="1"></span>';
            body += '  </div>';
        }
        body += '</div>';
    }

    var overlay = showWizardModal('批量新增配置组', body, function(ov) {
        var cntEl = ov.querySelector('.ag-count');
        var count = parseInt(cntEl.value, 10);
        if (isNaN(count) || count < 1) { dialog.alert('请输入有效的创建数量（≥1）'); return false; }

        // 收集每个字段的取值配置
        var cfgs = editable.map(function(f, k) {
            var id = 'ag' + k;
            var rb = ov.querySelector('input[name="' + id + '_mode"]:checked');
            var mode = rb ? rb.value : 'fixed';
            if (mode === 'serial') {
                var prefix = (ov.querySelector('.' + id + '_pre') || {}).value || '';
                var sep = (ov.querySelector('.' + id + '_sep') || {}).value || '';
                var start = parseFloat((ov.querySelector('.' + id + '_start') || {}).value);
                var step = parseFloat((ov.querySelector('.' + id + '_step') || {}).value);
                if (isNaN(start)) start = 0;
                if (isNaN(step)) step = 0;
                return { f: f, mode: 'serial', prefix: prefix, sep: sep, start: start, step: step };
            }
            var fixedEl = ov.querySelector('.' + id + '_fixed');
            var val;
            if (f.type === 'boolean') val = !!fixedEl.checked;
            else if (f.type === 'number') { var v = parseFloat(fixedEl.value); val = isNaN(v) ? 0 : v; }
            else val = fixedEl.value;
            return { f: f, mode: 'fixed', fixed: val };
        });

        for (var i = 0; i < count; i++) {
            var item = {};
            cfgs.forEach(function(cfg) {
                var f = cfg.f;
                if (cfg.mode === 'serial') {
                    if (f.type === 'number') {
                        item[f.key] = cfg.start + cfg.step * i;
                    } else {
                        item[f.key] = cfg.prefix + cfg.sep + fmtSerialNum(cfg.start + cfg.step * i);
                    }
                } else {
                    item[f.key] = cfg.fixed;
                }
            });
            // 只读字段继承首个已有配置组
            fields.forEach(function(f) {
                if (f.readonly) {
                    item[f.key] = (state.data[0] && state.data[0][f.key] !== undefined)
                        ? state.data[0][f.key]
                        : (f.type === 'number' ? 0 : (f.type === 'boolean' ? false : ''));
                }
            });
            if (!item.id || item.id === '') item.id = 'NEW_' + (state.data.length + 1);
            state.data.push(item);
        }
        rerender();
        onChange(state.data);
    });

    function refreshPreview() {
        var cnt = parseInt(overlay.querySelector('.ag-count').value, 10) || 0;
        var pv = overlay.querySelector('.ag-preview');
        if (cnt < 1) { pv.textContent = ''; return; }
        for (var k = 0; k < editable.length; k++) {
            var id = 'ag' + k;
            var rb = overlay.querySelector('input[name="' + id + '_mode"]:checked');
            if (rb && rb.value === 'serial' && editable[k].type !== 'number') {
                var prefix = overlay.querySelector('.' + id + '_pre').value || '';
                var sep = overlay.querySelector('.' + id + '_sep').value || '';
                var start = parseFloat(overlay.querySelector('.' + id + '_start').value) || 0;
                var step = parseFloat(overlay.querySelector('.' + id + '_step').value) || 0;
                var arr = [];
                for (var i = 0; i < Math.min(cnt, 4); i++) arr.push(prefix + sep + fmtSerialNum(start + step * i));
                pv.textContent = '示例：' + arr.join('、') + (cnt > 4 ? ' …' : '');
                return;
            }
        }
        pv.textContent = '';
    }

    overlay.querySelectorAll('input[name$="_mode"]').forEach(function(rb) {
        rb.addEventListener('change', function() {
            var fid = rb.name.replace('_mode', '');
            var fld = overlay.querySelector('#agf-' + fid);
            if (!fld) return;
            var fixedDiv = fld.querySelector('.ag-fixed');
            var serialDiv = fld.querySelector('.ag-serial');
            if (rb.value === 'serial') { serialDiv.style.display = 'block'; fixedDiv.style.display = 'none'; }
            else { serialDiv.style.display = 'none'; fixedDiv.style.display = 'block'; }
            refreshPreview();
        });
    });
    overlay.querySelector('.ag-count').addEventListener('input', refreshPreview);
    overlay.querySelectorAll('.ag-serial input').forEach(function(inp) { inp.addEventListener('input', refreshPreview); });
}

/** 新增字段：输入字段名 + 选类型；按类型规则赋初始值到每个配置组 */
function openAddFieldModal(state, rerender, onChange) {
    var body = ''
        + '<div class="form-group">'
        + '  <label class="form-label-sm">字段名称（key）</label>'
        + '  <input type="text" class="af-key form-input form-input-sm" placeholder="例如 customField">'
        + '</div>'
        + '<div class="form-group">'
        + '  <label class="form-label-sm">字段类型</label>'
        + '  <select class="af-type form-input form-input-sm">'
        + '    <option value="string">字符串 String（默认空，可逐组填入）</option>'
        + '    <option value="number">数值 Number（初始值 + 步长，逐组递增）</option>'
        + '    <option value="boolean">布尔 Boolean（默认 false 勾选框）</option>'
        + '  </select>'
        + '</div>'
        + '<div class="af-num-opts" style="display:none;">'
        + '  <div class="form-group"><label class="form-label-sm">初始值</label><input type="number" step="any" class="af-init form-input form-input-sm"></div>'
        + '  <div class="form-group"><label class="form-label-sm">步长（可为小数或 0）</label><input type="number" step="any" class="af-step form-input form-input-sm"></div>'
        + '</div>';

    var overlay = showWizardModal('新增字段', body, function(ov) {
        var key = ov.querySelector('.af-key').value.trim();
        if (!key) { dialog.alert('请输入字段名称'); return false; }
        if (state.fields.some(function(f) { return f.key === key; })) { dialog.alert('字段名「' + key + '」已存在'); return false; }
        var type = ov.querySelector('.af-type').value;
        var ftype = (type === 'number') ? 'number' : (type === 'boolean' ? 'boolean' : 'text');
        state.fields.push({ key: key, label: key, type: ftype });

        state.data.forEach(function(it, i) {
            if (type === 'string') {
                it[key] = '';
            } else if (type === 'boolean') {
                it[key] = false;
            } else {
                var initEl = ov.querySelector('.af-init');
                var stepEl = ov.querySelector('.af-step');
                var init = (initEl && initEl.value !== '') ? parseFloat(initEl.value) : 0;
                var step = (stepEl && stepEl.value !== '') ? parseFloat(stepEl.value) : 0;
                if (isNaN(init)) init = 0;
                if (isNaN(step)) step = 0;
                it[key] = init + step * i;
            }
        });
        rerender();
        onChange(state.data);
    });

    var sel = overlay.querySelector('.af-type');
    var numOpts = overlay.querySelector('.af-num-opts');
    sel.addEventListener('change', function() {
        numOpts.style.display = (sel.value === 'number') ? 'block' : 'none';
    });
}

/** 删除字段：弹出窗口，列出当前全部字段，用户选择其一删除（同时从每个配置组移除该键） */
function openDeleteFieldModal(state, rerender, onChange) {
    if (!state.fields.length) { dialog.alert('当前没有可删除的字段'); return; }
    var optsHtml = '';
    state.fields.forEach(function(f, idx) {
        optsHtml += '<option value="' + idx + '">' + escapeHtml(f.label) + ' (' + escapeHtml(f.key) + ')</option>';
    });
    var body = ''
        + '<p class="wizard-modal-tip">选择要删除的字段，将同时移除每个配置组下的该字段：</p>'
        + '<div class="form-group"><label class="form-label-sm">字段</label>'
        + '<select class="df-key form-input form-input-sm">' + optsHtml + '</select></div>';
    showWizardModal('删除字段', body, function(ov) {
        var idx = parseInt(ov.querySelector('.df-key').value, 10);
        if (isNaN(idx) || idx < 0 || idx >= state.fields.length) { dialog.alert('请选择有效字段'); return false; }
        var fk = state.fields[idx].key;
        state.fields.splice(idx, 1);
        state.data.forEach(function(it) { if (it && fk in it) delete it[fk]; });
        rerender();
        onChange(state.data);
    });
}

/** 批量删除配置组：勾选多个配置组，确认后一并删除 */
function openBatchDeleteModal(state, rerender, onChange) {
    if (!state.data.length) { dialog.alert('当前没有可删除的配置组'); return; }
    var itemsHtml = '';
    state.data.forEach(function(it, i) {
        var label = it.id || it.name || ('#' + (i + 1));
        itemsHtml += '<label class="bd-item">'
            + '<input type="checkbox" class="bd-chk" data-i="' + i + '">'
            + '<span class="bd-index">' + (i + 1) + '</span>'
            + '<span class="bd-label">' + escapeHtml(String(label)) + '</span>'
            + '</label>';
    });
    var body = ''
        + '<p class="wizard-modal-tip">勾选要删除的配置组，确认后将一并移除（不可撤销）。<b>提示：在列表中按住鼠标拖动可批量勾选 / 取消</b>。</p>'
        + '<div class="bd-actions"><label class="bd-all-wrap"><input type="checkbox" class="bd-all"> 全选 / 全不选</label></div>'
        + '<div class="bd-list">' + itemsHtml + '</div>';

    var overlay = showWizardModal('批量删除配置组', body, function(ov) {
        var chks = Array.prototype.slice.call(ov.querySelectorAll('.bd-chk:checked'));
        if (!chks.length) { dialog.alert('请至少勾选一个配置组'); return false; }
        var idxs = chks.map(function(c) { return parseInt(c.dataset.i, 10); });
        idxs.sort(function(a, b) { return b - a; }); // 从后往前删，避免索引偏移
        idxs.forEach(function(i) { state.data.splice(i, 1); });
        rerender();
        onChange(state.data);
    });

    var allChk = overlay.querySelector('.bd-all');
    if (allChk) {
        allChk.addEventListener('change', function() {
            overlay.querySelectorAll('.bd-chk').forEach(function(c) { c.checked = allChk.checked; });
        });
    }

    // 滑动勾选：按住鼠标在列表上拖动，经过的配置组统一设为「按下首项的反状态」
    var list = overlay.querySelector('.bd-list');
    if (list) {
        var isDown = false, paintState = false, suppressClick = false;
        function syncAll() {
            if (!allChk) return;
            var chks = list.querySelectorAll('.bd-chk');
            var checked = list.querySelectorAll('.bd-chk:checked');
            allChk.checked = chks.length > 0 && chks.length === checked.length;
        }
        list.addEventListener('mousedown', function(e) {
            var item = e.target.closest('.bd-item');
            if (!item) return;
            var chk = item.querySelector('.bd-chk');
            e.preventDefault(); // 阻止原生切换与文本选中
            isDown = true;
            suppressClick = true;
            paintState = !chk.checked;
            chk.checked = paintState;
            syncAll();
        });
        list.addEventListener('mouseover', function(e) {
            if (!isDown) return;
            var item = e.target.closest('.bd-item');
            if (!item) return;
            var chk = item.querySelector('.bd-chk');
            if (chk) chk.checked = paintState;
        });
        list.addEventListener('click', function(e) {
            if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
        });
        function onDocMouseUp() {
            isDown = false;
            syncAll();
            if (!document.body.contains(overlay)) {
                document.removeEventListener('mouseup', onDocMouseUp);
            }
        }
        document.addEventListener('mouseup', onDocMouseUp);
    }
}

/**
 * 页面设计（ccr_config）：把某站点的调光器拖拽布置到「行(row) × 列(column)」网格中。
 * - 读取 ccr_config 中所有 site_xx，每个站点形成一页（顶部下拉切换）。
 * - 网格尺寸默认取该站点在 ccr_card_config 中定义的 rows/columns（参考 ccr_card 页面设计逻辑）。
 * - 右侧列出该站点全部 ccr；已有 row/colum 的自动预落位；拖拽落点写回这两个值；× 清除位置。
 */
function openCcrPageDesignModal(state, rerender, onChange) {
    var all = state.data; // 当前 ccr_config 实时数据
    var siteSet = {};
    all.forEach(function(it) { if (it && it.site_id) siteSet[it.site_id] = true; });
    var sites = Object.keys(siteSet).sort();
    if (!sites.length) { dialog.alert('当前 ccr_config 中没有任何 site_id，无法进入页面设计。请先在配置组中填写 site_id。'); return; }

    // 工作副本：所有改动落在 work 上，保存时才写回 state.data
    var work = JSON.parse(JSON.stringify(all));

    // 取某站点在 ccr_card_config 中的网格尺寸作为默认行列
    function cardSizeFor(site) {
        var cd = null;
        try { if (wizardState.generatedData && wizardState.generatedData['ccr_card_config']) cd = JSON.parse(wizardState.generatedData['ccr_card_config']); } catch (e) {}
        if (!cd || !cd.length) cd = TEMPLATE_DEFAULTS['ccr_card_config'] || [];
        var card = null;
        for (var k = 0; k < cd.length; k++) { if (cd[k] && cd[k].site_id === site) { card = cd[k]; break; } }
        if (card && card.rows && card.columns) return { rows: +card.rows, cols: +card.columns };
        var mr = 0, mc = 0;
        work.forEach(function(it) {
            if (it.site_id === site) {
                if (typeof it.row === 'number' && it.row > mr) mr = it.row;
                if (typeof it.colum === 'number' && it.colum > mc) mc = it.colum;
            }
        });
        return { rows: Math.max(1, mr + 1), cols: Math.max(1, mc + 1) };
    }

    var overlay = document.createElement('div');
    overlay.className = 'wizard-modal-overlay pd-overlay';
    overlay.innerHTML = ''
        + '<div class="wizard-modal pd-modal">'
        + '  <div class="wizard-modal-head"><span>页面设计 — 调光器配置 (ccr_config)</span><button type="button" class="wizard-modal-close" title="关闭">×</button></div>'
        + '  <div class="wizard-modal-body pd-body">'
        + '    <div class="pd-controls">'
        + '      <span class="pd-ctl"><label>站点</label><select class="pd-site form-input form-input-sm">' + sites.map(function(s) { return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>'; }).join('') + '</select></span>'
        + '      <span class="pd-ctl"><label>行(row)</label><input type="number" min="1" class="pd-rows form-input form-input-sm" value="11"></span>'
        + '      <span class="pd-ctl"><label>列(column)</label><input type="number" min="1" class="pd-cols form-input form-input-sm" value="11"></span>'
        + '      <button type="button" class="btn btn-primary btn-sm pd-apply">应用尺寸</button>'
        + '      <span class="pd-hint">拖拽右侧调光器到左侧网格即可落位；已有 row/colum 的会自动落位。点击芯片 × 或拖回右侧列表可清除位置。</span>'
        + '    </div>'
        + '    <div class="pd-workspace">'
        + '      <div class="pd-grid-wrap"><div class="pd-grid"></div></div>'
        + '      <div class="pd-list-wrap"><div class="pd-list-title">本站点调光器</div><div class="pd-list"></div>'
        + '    </div>'
        + '  </div>'
        + '  <div class="wizard-modal-foot">'
        + '    <button type="button" class="btn btn-outline btn-sm pd-cancel">取消</button>'
        + '    <button type="button" class="btn btn-primary btn-sm pd-save">保存并返回</button>'
        + '  </div>'
        + '</div>';

    document.body.appendChild(overlay);
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.querySelector('.wizard-modal-close').addEventListener('click', close);
    overlay.querySelector('.pd-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    var siteSel = overlay.querySelector('.pd-site');
    var rowsInp = overlay.querySelector('.pd-rows');
    var colsInp = overlay.querySelector('.pd-cols');
    var gridEl = overlay.querySelector('.pd-grid');
    var listEl = overlay.querySelector('.pd-list');

    function curSite() { return siteSel.value; }

    function placedMap() {
        var m = {};
        work.forEach(function(it, idx) {
            if (it.site_id === curSite() && typeof it.row === 'number' && typeof it.colum === 'number') {
                var key = it.row + '_' + it.colum;
                (m[key] = m[key] || []).push(idx);
            }
        });
        return m;
    }

    function renderGrid() {
        var rows = Math.max(1, parseInt(rowsInp.value, 10) || 1);
        var cols = Math.max(1, parseInt(colsInp.value, 10) || 1);
        var pm = placedMap();
        var html = '';
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var idxs = pm[r + '_' + c] || [];
                var chips = '';
                idxs.forEach(function(idx) {
                    var it = work[idx];
                    chips += '<div class="pd-chip" draggable="true" data-idx="' + idx + '">'
                        + '<span class="pd-chip-id">' + escapeHtml(it.id != null ? String(it.id) : '-') + '</span>'
                        + (it.name ? '<span class="pd-chip-name">' + escapeHtml(it.name) + '</span>' : '')
                        + '<button type="button" class="pd-chip-x" data-idx="' + idx + '" title="清除位置">×</button>'
                        + '</div>';
                });
                html += '<div class="pd-cell" data-r="' + r + '" data-c="' + c + '">'
                    + '<span class="pd-cell-coord">' + r + ',' + c + '</span>'
                    + chips
                    + '</div>';
            }
        }
        gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
        gridEl.innerHTML = html;
    }

    function renderList() {
        var site = curSite();
        var html = '';
        work.forEach(function(it, idx) {
            if (it.site_id !== site) return;
            var placed = (typeof it.row === 'number' && typeof it.colum === 'number');
            var badge = placed
                ? '<span class="pd-badge">已放置 ' + it.row + ',' + it.colum + '</span>'
                : '<span class="pd-badge pd-badge-none">未放置</span>';
            html += '<div class="pd-item" draggable="true" data-idx="' + idx + '">'
                + '<span class="pd-item-id">' + escapeHtml(it.id != null ? String(it.id) : '-') + '</span>'
                + (it.name ? '<span class="pd-item-name">' + escapeHtml(it.name) + '</span>' : '')
                + badge
                + '</div>';
        });
        listEl.innerHTML = html || '<div class="pd-empty">该站点暂无调光器</div>';
    }

    function clearPos(idx) { delete work[idx].row; delete work[idx].colum; }

    // 拖拽开始（事件委托到 overlay，innerHTML 刷新后仍有效）
    overlay.addEventListener('dragstart', function(e) {
        var el = e.target.closest('.pd-item, .pd-chip');
        if (!el) return;
        e.dataTransfer.setData('text/plain', el.getAttribute('data-idx'));
        e.dataTransfer.effectAllowed = 'move';
    });

    // 芯片 × 清除
    overlay.addEventListener('click', function(e) {
        var x = e.target.closest('.pd-chip-x');
        if (x) { clearPos(+x.getAttribute('data-idx')); renderGrid(); renderList(); }
    });

    // 网格落点
    gridEl.addEventListener('dragover', function(e) {
        e.preventDefault();
        var cell = e.target.closest('.pd-cell');
        if (cell) cell.classList.add('pd-cell-over');
    });
    gridEl.addEventListener('dragleave', function(e) {
        var cell = e.target.closest('.pd-cell');
        if (cell) cell.classList.remove('pd-cell-over');
    });
    gridEl.addEventListener('drop', function(e) {
        e.preventDefault();
        var cell = e.target.closest('.pd-cell');
        if (!cell) return;
        cell.classList.remove('pd-cell-over');
        var idx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(idx)) return;
        work[idx].row = +cell.getAttribute('data-r');
        work[idx].colum = +cell.getAttribute('data-c');
        renderGrid();
        renderList();
    });

    // 右侧列表：拖回即清除位置
    listEl.addEventListener('dragover', function(e) { e.preventDefault(); });
    listEl.addEventListener('drop', function(e) {
        e.preventDefault();
        var idx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(idx)) return;
        clearPos(idx);
        renderGrid();
        renderList();
    });

    // 站点切换：套用该站点在 ccr_card_config 的网格尺寸并刷新
    siteSel.addEventListener('change', function() { selectSite(curSite()); });
    overlay.querySelector('.pd-apply').addEventListener('click', function() { renderGrid(); });

    function selectSite(site) {
        var sz = cardSizeFor(site);
        rowsInp.value = sz.rows;
        colsInp.value = sz.cols;
        renderGrid();
        renderList();
    }

    // 保存：把 work 的坐标写回 state.data（work 与 state.data 一一对应）
    overlay.querySelector('.pd-save').addEventListener('click', function() {
        work.forEach(function(it, i) {
            if (i >= state.data.length) return;
            if (typeof it.row === 'number' && typeof it.colum === 'number') {
                state.data[i].row = it.row;
                state.data[i].colum = it.colum;
            } else {
                delete state.data[i].row;
                delete state.data[i].colum;
            }
        });
        rerender();
        onChange(state.data);
        close();
    });

    selectSite(sites[0]);
}

/** 通用模态弹窗：标题 + 主体 + 确定/取消；onConfirm 返回 false 则保持打开（用于校验失败） */
function showWizardModal(title, bodyHtml, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'wizard-modal-overlay';
    overlay.innerHTML = ''
        + '<div class="wizard-modal">'
        + '  <div class="wizard-modal-head"><span>' + escapeHtml(title) + '</span><button type="button" class="wizard-modal-close" title="关闭">×</button></div>'
        + '  <div class="wizard-modal-body">' + bodyHtml + '</div>'
        + '  <div class="wizard-modal-foot">'
        + '    <button type="button" class="btn btn-outline btn-sm wizard-modal-cancel">取消</button>'
        + '    <button type="button" class="btn btn-primary btn-sm wizard-modal-ok">确定</button>'
        + '  </div>'
        + '</div>';
    document.body.appendChild(overlay);
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.querySelector('.wizard-modal-close').addEventListener('click', close);
    overlay.querySelector('.wizard-modal-cancel').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    overlay.querySelector('.wizard-modal-ok').addEventListener('click', function() {
        var res = onConfirm(overlay);
        if (res !== false) close();
    });
    return overlay;
}

/** 通用数组表单编辑器（左表单 + 右预览） */
function renderArrayFormEditor(container, data, onChange, fields) {
    if (!fields || !fields.length) fields = detectArrayFields(data[0] || {});
    var html = '<div class="wizard-form">';

    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var itemLabel = item.id || item.name || ('#' + (i + 1));

        html += '<div class="shape-section">';
        html += '  <div class="shape-header" style="cursor:default;">' + escapeHtml(itemLabel) + '</div>';
        html += '  <div class="shape-body">';

        for (var fi = 0; fi < fields.length; fi++) {
            var f = fields[fi];
            var fv = item[f.key];
            var fvStr = fv !== undefined && fv !== null ? String(fv) : '';

            if (f.readonly) {
                html += '    <div class="form-group form-group-param">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-input form-input-sm" type="text" value="' + escapeHtml(fvStr) + '" readonly style="opacity:0.5;background:transparent;border-color:transparent;">';
                html += '    </div>';
            } else if (f.type === 'color') {
                html += '    <div class="form-group form-group-param">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-input form-input-clr" type="color" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" value="' + escapeHtml(fvStr) + '">';
                html += '      <input class="form-input form-input-sm color-text" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" value="' + escapeHtml(fvStr) + '" style="flex:1;min-width:50px;font-family:monospace;font-size:11px;">';
                html += '    </div>';
            } else if (f.type === 'boolean') {
                html += '    <div class="form-group form-group-param">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-cb" type="checkbox" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" ' + (fv ? 'checked' : '') + '>';
                html += '    </div>';
            } else if (f.type === 'number') {
                html += '    <div class="form-group form-group-param">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-input form-input-sm arr-num" type="number" step="any" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" value="' + fv + '">';
                html += '    </div>';
            } else if (f.type === 'json') {
                var _jsonStr = JSON.stringify(fv, null, 2);
                var _jsonLines = _jsonStr.split('\n').length;
                var _jsonRows = Math.max(4, Math.min(_jsonLines, 20));
                html += '    <div class="form-group">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <textarea class="form-textarea form-textarea-sm arr-json" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" rows="' + _jsonRows + '" spellcheck="false">' + escapeHtml(_jsonStr) + '</textarea>';
                html += '    </div>';
            } else {
                html += '    <div class="form-group form-group-param">';
                html += '      <label class="form-label form-label-sm">' + escapeHtml(f.label) + '</label>';
                html += '      <input class="form-input form-input-sm arr-txt" type="text" data-i="' + i + '" data-fk="' + escapeHtml(f.key) + '" value="' + escapeHtml(fvStr) + '">';
                html += '    </div>';
            }
        }

        html += '  </div>';
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // 颜色拾取器 ↔ 文本框同步
    container.addEventListener('input', function(e) {
        var t = e.target;
        if (t.type === 'color' && t.dataset.fk) {
            var txt = container.querySelector('.color-text[data-i="' + t.dataset.i + '"][data-fk="' + t.dataset.fk + '"]');
            if (txt) txt.value = t.value;
            onChange(collectArrData(container, data, fields));
        }
        if (t.classList.contains('color-text') && t.dataset.fk && /^#[0-9a-f]{6}$/i.test(t.value)) {
            var clr = container.querySelector('input[type="color"][data-i="' + t.dataset.i + '"][data-fk="' + t.dataset.fk + '"]');
            if (clr) clr.value = t.value;
            onChange(collectArrData(container, data, fields));
        }
        if (t.classList.contains('arr-num') || t.classList.contains('arr-txt') || t.classList.contains('arr-json')) {
            onChange(collectArrData(container, data, fields));
        }
    });

    // checkbox change 单独监听
    container.addEventListener('change', function(e) {
        if (e.target.classList.contains('form-cb')) {
            onChange(collectArrData(container, data, fields));
        }
        if (e.target.type === 'color') {
            // color change already handled by input
        }
    });

    // 初始同步，确保 currentFormData 非空
    onChange(collectArrData(container, data, fields));
}

function collectArrData(container, data, fields) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        var item = JSON.parse(JSON.stringify(data[i]));
        for (var fi = 0; fi < fields.length; fi++) {
            var f = fields[fi];
            if (f.readonly) continue;
            if (f.type === 'color') {
                var txt = container.querySelector('.color-text[data-i="' + i + '"][data-fk="' + f.key + '"]');
                if (txt) item[f.key] = txt.value;
            } else if (f.type === 'boolean') {
                var cb = container.querySelector('.form-cb[data-i="' + i + '"][data-fk="' + f.key + '"]');
                if (cb) item[f.key] = cb.checked;
            } else if (f.type === 'number') {
                var inp = container.querySelector('.arr-num[data-i="' + i + '"][data-fk="' + f.key + '"]');
                if (inp) item[f.key] = parseFloat(inp.value) || 0;
            } else if (f.type === 'json') {
                var inp = container.querySelector('.arr-json[data-i="' + i + '"][data-fk="' + f.key + '"]');
                if (inp) {
                    try { item[f.key] = JSON.parse(inp.value); }
                    catch(e) { item[f.key] = inp.value; }
                }
            } else {
                var inp = container.querySelector('.arr-txt[data-i="' + i + '"][data-fk="' + f.key + '"]');
                if (inp) item[f.key] = inp.value;
            }
        }
        result.push(item);
    }
    return result;
}

function renderBasicShapesForm(container, data, onChange) {
    var selectedKey = null;

    function render() {
        var shapeKeys = Object.keys(data.shapes || {});
        var html = '<div class="wizard-form bs-main-form">';

        // === 顶部信息栏（紧凑） ===
        html += '<div class="bs-info-bar">';
        html += '  <div class="form-group form-group-param" style="margin-bottom:0;"><label class="form-label form-label-sm" style="flex:0 0 50px;">version</label><input class="form-input form-input-sm" id="bs_version" value="' + escapeHtml(data.version) + '" style="flex:0 0 80px;"></div>';
        html += '  <div class="form-group form-group-param" style="margin-bottom:0;flex:1;"><label class="form-label form-label-sm" style="flex:0 0 60px;">description</label><input class="form-input form-input-sm" id="bs_description" value="' + escapeHtml(data.description) + '"></div>';
        html += '</div>';

        // === 图形按钮 ===
        html += '<div class="bs-section-title">图形模板 (' + shapeKeys.length + ')</div>';
        html += '<div class="bs-shape-list">';
        for (var si = 0; si < shapeKeys.length; si++) {
            var sk = shapeKeys[si];
            html += '<div class="bs-shape-item' + (selectedKey === sk ? ' selected' : '') + '" data-sk="' + escapeHtml(sk) + '">' + escapeHtml(sk) + '</div>';
        }
        html += '</div>';

        html += '<div style="display:flex;gap:6px;margin:4px 0 6px;">';
        html += '  <button class="btn btn-outline btn-sm" id="bsImportBtn">导入</button>';
        html += '</div>';

        // === 属性信息（选中图形时内联显示） ===
        if (selectedKey && data.shapes[selectedKey]) {
            var shape = data.shapes[selectedKey];
            var params = shape.defaultParams || {};
            var paramKeys = Object.keys(params);
            var paramDescs = shape.paramDescriptions || {};

            html += '<div class="bs-props">';
            html += '  <div class="bs-props-title">属性信息 \u2014 <strong>' + escapeHtml(selectedKey) + '</strong> <span style="font-weight:400;font-size:11px;color:var(--text-secondary);">(' + escapeHtml(shape.type || '') + ')</span></div>';

            html += '  <div class="form-group"><label class="form-label form-label-sm">description</label>'
                + '<textarea class="form-textarea form-textarea-sm shape-field" data-fn="desc" data-sk="' + escapeHtml(selectedKey) + '" rows="2">' + escapeHtml(shape.description || '') + '</textarea></div>';

            for (var pi = 0; pi < paramKeys.length; pi++) {
                var pk = paramKeys[pi];
                var pv = params[pk];
                var hint = paramDescs[pk] || '';

                if (pk === 'points' && Array.isArray(pv)) {
                    html += '  <div class="form-group"><label class="form-label form-label-sm">' + escapeHtml(pk) + '</label>'
                        + '<textarea class="form-textarea form-textarea-sm param-field" data-sk="' + escapeHtml(selectedKey) + '" data-pk="' + escapeHtml(pk) + '" rows="2">' + escapeHtml(JSON.stringify(pv)) + '</textarea></div>';
                } else if (typeof pv === 'number') {
                    html += '  <div class="form-group form-group-param">'
                        + '<label class="form-label form-label-sm" title="' + escapeHtml(hint) + '" style="flex:0 0 90px;">' + escapeHtml(pk) + '</label>'
                        + '<input class="form-input form-input-sm param-input" type="number" step="any" data-sk="' + escapeHtml(selectedKey) + '" data-pk="' + escapeHtml(pk) + '" value="' + pv + '" style="flex:0 0 90px;">'
                        + '<span class="param-hint">' + escapeHtml(hint) + '</span></div>';
                }
            }

            html += '  <div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border-color);display:flex;gap:6px;">';
            html += '    <button class="btn btn-outline btn-sm" id="bsDeleteShape" style="color:var(--msg-error-text);border-color:var(--msg-error-text);font-size:11px;">删除此图形</button>';
            html += '  </div>';

            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
        bindEvents();
        renderPreviewArea();
    }

    function renderPreviewArea() {
        var previewContainer = document.getElementById('wizardEditorPreview');
        if (!previewContainer) return;
        if (selectedKey && data.shapes[selectedKey]) {
            previewContainer.innerHTML = ''
                + '<div class="bs-preview-section" style="height:100%;display:flex;flex-direction:column;">'
                + '  <div class="bs-preview-header">图形预览 \u2014 ' + escapeHtml(selectedKey) + '</div>'
                + '  <div class="bs-preview-canvas" id="bsPreviewCanvas" style="flex:1;height:auto;">' + renderShapePreviewSVG(data.shapes[selectedKey]) + '</div>'
                + '</div>';
        } else {
            previewContainer.innerHTML = '<div class="bs-preview-section" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-secondary);font-size:13px;">选择一个图形查看预览</div>';
        }
    }

    function updatePreview() {
        var canvas = document.getElementById('bsPreviewCanvas');
        if (!canvas || !selectedKey) return;
        var currentData = collectData();
        var shape = currentData.shapes && currentData.shapes[selectedKey];
        if (!shape) return;
        canvas.innerHTML = renderShapePreviewSVG(shape);
    }

    function collectData() {
        var result = {
            version: (document.getElementById('bs_version') || {}).value || data.version,
            description: (document.getElementById('bs_description') || {}).value || data.description,
            globalParams: JSON.parse(JSON.stringify(data.globalParams)),
            shapes: {}
        };
        var shapeKeys = Object.keys(data.shapes || {});
        for (var s = 0; s < shapeKeys.length; s++) {
            var sk = shapeKeys[s];
            var origShape = data.shapes[sk];
            result.shapes[sk] = JSON.parse(JSON.stringify(origShape));

            var descEl = container.querySelector('.shape-field[data-sk="' + sk + '"][data-fn="desc"]');
            if (descEl) result.shapes[sk].description = descEl.value;

            var paramInputs = container.querySelectorAll('.param-input[data-sk="' + sk + '"]');
            for (var pi = 0; pi < paramInputs.length; pi++) {
                var inp = paramInputs[pi];
                var pk = inp.dataset.pk;
                result.shapes[sk].defaultParams[pk] = parseFloat(inp.value) || 0;
            }
            var complexInputs = container.querySelectorAll('.param-field[data-sk="' + sk + '"]');
            for (var ci = 0; ci < complexInputs.length; ci++) {
                var cinp = complexInputs[ci];
                var cpk = cinp.dataset.pk;
                try { result.shapes[sk].defaultParams[cpk] = JSON.parse(cinp.value); }
                catch(e) { result.shapes[sk].defaultParams[cpk] = cinp.value; }
            }
        }
        return result;
    }

    function bindEvents() {
        var items = container.querySelectorAll('.bs-shape-item');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function() {
                selectedKey = this.dataset.sk;
                render();
                onChange(collectData());
            });
        }

        // 属性字段变更 → 自动保存 + 更新预览
        var debounceTimer = null;
        container.addEventListener('input', function(e) {
            if (e.target.classList.contains('param-input') || e.target.classList.contains('param-field') || e.target.classList.contains('shape-field')) {
                onChange(collectData());
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(updatePreview, 100);
            }
            if (e.target.id === 'bs_version' || e.target.id === 'bs_description') {
                if (e.target.id === 'bs_version') data.version = e.target.value;
                if (e.target.id === 'bs_description') data.description = e.target.value;
                onChange(collectData());
            }
        });

        var importBtn = document.getElementById('bsImportBtn');
        if (importBtn) importBtn.addEventListener('click', handleImport);

        var delBtn = document.getElementById('bsDeleteShape');
        if (delBtn) {
            delBtn.addEventListener('click', async function() {
                if (!selectedKey) return;
                if (!(await dialog.confirm('\u786e\u5b9a\u5220\u9664\u56fe\u5f62 "' + selectedKey + '" \uff1f', '删除图形', true))) return;
                delete data.shapes[selectedKey];
                selectedKey = null;
                render();
                onChange(collectData());
            });
        }
    }

    function handleImport() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) { document.body.removeChild(input); return; }
            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    var imported = JSON.parse(ev.target.result);
                    if (!imported.shapes || !imported.version) {
                        showStatus('\u65e0\u6548\u7684 basic_shapes \u6a21\u677f\uff1a\u7f3a\u5c11\u5fc5\u8981\u5b57\u6bb5 (version, shapes)', 'error');
                        document.body.removeChild(input);
                        return;
                    }
                    data.version = imported.version;
                    data.description = imported.description || '';
                    data.globalParams = imported.globalParams || data.globalParams;
                    data.shapes = imported.shapes;
                    selectedKey = null;
                    render();
                    onChange(collectData());
                    showStatus('\u5bfc\u5165\u6210\u529f\uff1a' + Object.keys(imported.shapes).length + ' \u4e2a\u56fe\u5f62', 'success');
                } catch(e) {
                    showStatus('JSON \u89e3\u6790\u5931\u8d25\uff1a' + e.message, 'error');
                }
                document.body.removeChild(input);
            };
            reader.readAsText(file);
        });
        input.click();
    }

    render();
    onChange(collectData());
}

/* ============================================================
 * 通用对象编辑器：渲染任意「顶层为对象」的 JSON 配置
 *  - 标量(string/number/boolean) → 输入框 / 数字框 / 勾选框
 *  - 对象数组 → 卡片（提取公共标量字段编辑，支持增删项）
 *  - 标量数组 → 列表（逐项文本输入，支持增删项）
 *  - 嵌套对象 → 可展开子表单
 *  - 顶层支持「新增字段 / 删除字段」
 * 所有改动实时同步右侧 JSON 预览（通过 onChange）。
 * ============================================================ */
function renderGenericObjectEditor(container, obj, onChange) {
    var rootObj = obj;

    function emit() { if (onChange) onChange(rootObj); }

    // 是否为「对象数组」（数组元素为普通对象）
    function isObjectArray(arr) {
        return arr.length > 0 && arr[0] && typeof arr[0] === 'object' && !Array.isArray(arr[0]);
    }

    // 提取对象数组中各元素共有的标量字段
    function commonScalarFields(arr) {
        var common = null;
        for (var i = 0; i < arr.length; i++) {
            var rec = arr[i];
            if (!rec || typeof rec !== 'object') continue;
            var flat = Object.keys(rec).filter(function(k) {
                var v = rec[k];
                return v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
            });
            if (common === null) common = {};
            else {
                var cur = {};
                for (var j = 0; j < flat.length; j++) cur[flat[j]] = true;
                for (var ck in common) if (!cur[ck]) delete common[ck];
            }
            for (var f = 0; f < flat.length; f++) if (!(flat[f] in common)) common[flat[f]] = true;
        }
        return common ? Object.keys(common) : [];
    }

    function defaultValueForType(t) {
        if (t === 'number') return 0;
        if (t === 'boolean') return false;
        if (t === 'object') return {};
        if (t === 'array') return [];
        return '';
    }

    // 标量输入
    function buildScalar(val, onSet) {
        if (typeof val === 'boolean') {
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'form-cb obj-scalar';
            cb.checked = !!val;
            cb.addEventListener('change', function() { onSet(cb.checked); emit(); });
            return cb;
        }
        var inp = document.createElement('input');
        inp.className = 'form-input form-input-sm obj-scalar';
        if (typeof val === 'number') {
            inp.type = 'number'; inp.step = 'any';
            inp.value = (val === null || val === undefined) ? '' : val;
            inp.addEventListener('input', function() {
                onSet(inp.value === '' ? null : parseFloat(inp.value)); emit();
            });
        } else {
            inp.type = 'text';
            inp.value = (val === null || val === undefined) ? '' : String(val);
            inp.addEventListener('input', function() { onSet(inp.value); emit(); });
        }
        return inp;
    }

    // 对象数组 → 卡片列表
    function buildObjectArray(container, arr) {
        var fields = commonScalarFields(arr);
        var wrap = document.createElement('div');
        wrap.className = 'obj-array obj-array-cards';

        var bar = document.createElement('div');
        bar.className = 'obj-array-bar';
        bar.innerHTML = '<span class="obj-array-count">' + arr.length + ' 项</span>';
        var addBtn = document.createElement('button');
        addBtn.type = 'button'; addBtn.className = 'btn btn-primary btn-sm'; addBtn.textContent = '＋ 新增项';
        addBtn.addEventListener('click', function() {
            var item = {};
            for (var i = 0; i < fields.length; i++) {
                var t = typeof (arr.length ? arr[0][fields[i]] : '');
                item[fields[i]] = defaultValueForType(t === 'object' ? 'string' : t);
            }
            arr.push(item);
            rebuildAll();
        });
        bar.appendChild(addBtn);
        wrap.appendChild(bar);

        for (var i = 0; i < arr.length; i++) {
            (function(idx) {
                var card = document.createElement('div');
                card.className = 'obj-card';
                var head = document.createElement('div');
                head.className = 'obj-card-head';
                var headId = arr[idx].id != null ? String(arr[idx].id)
                    : (arr[idx].name != null ? String(arr[idx].name) : ('#' + (idx + 1)));
                head.innerHTML = '<span class="brush-id">' + escapeHtml(headId) + '</span>';
                var del = document.createElement('button');
                del.type = 'button'; del.className = 'card-del-btn'; del.textContent = '×';
                del.title = '删除该项';
                del.addEventListener('click', async function() {
                    if (await dialog.confirm('确认删除该项「' + headId + '」？', '删除项', true)) { arr.splice(idx, 1); rebuildAll(); }
                });
                head.appendChild(del);
                card.appendChild(head);

                var body = document.createElement('div');
                body.className = 'obj-card-body';
                for (var fi = 0; fi < fields.length; fi++) {
                    (function(fk) {
                        var fg = document.createElement('div');
                        fg.className = 'form-group';
                        var lb = document.createElement('label');
                        lb.className = 'form-label form-label-sm'; lb.textContent = fk;
                        fg.appendChild(lb);
                        fg.appendChild(buildScalar(arr[idx][fk], function(nv) { arr[idx][fk] = nv; }));
                        body.appendChild(fg);
                    })(fields[fi]);
                }
                if (fields.length === 0) {
                    var empty = document.createElement('div');
                    empty.className = 'obj-card-empty';
                    empty.textContent = '（无标量字段，仅含嵌套结构）';
                    body.appendChild(empty);
                }
                card.appendChild(body);
                wrap.appendChild(card);
            })(i);
        }
        container.appendChild(wrap);
    }

    // 标量数组 → 列表
    function buildScalarArray(container, arr) {
        var wrap = document.createElement('div');
        wrap.className = 'obj-array obj-array-list';
        var bar = document.createElement('div');
        bar.className = 'obj-array-bar';
        bar.innerHTML = '<span class="obj-array-count">' + arr.length + ' 项</span>';
        var addBtn = document.createElement('button');
        addBtn.type = 'button'; addBtn.className = 'btn btn-primary btn-sm'; addBtn.textContent = '＋ 新增项';
        addBtn.addEventListener('click', function() { arr.push(''); rebuildAll(); });
        bar.appendChild(addBtn);
        wrap.appendChild(bar);

        for (var i = 0; i < arr.length; i++) {
            (function(idx) {
                var item = document.createElement('div');
                item.className = 'obj-list-item';
                var inp = document.createElement('input');
                inp.type = 'text'; inp.className = 'form-input form-input-sm';
                inp.value = (arr[idx] === null || arr[idx] === undefined) ? '' : String(arr[idx]);
                inp.addEventListener('input', function() { arr[idx] = inp.value; emit(); });
                item.appendChild(inp);
                var del = document.createElement('button');
                del.type = 'button'; del.className = 'card-del-btn'; del.textContent = '×';
                del.title = '删除该项';
                del.addEventListener('click', function() { arr.splice(idx, 1); rebuildAll(); });
                item.appendChild(del);
                wrap.appendChild(item);
            })(i);
        }
        if (arr.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'obj-card-empty';
            empty.textContent = '（空数组）';
            wrap.appendChild(empty);
        }
        container.appendChild(wrap);
    }

    // 字段构造：根据值类型返回控件（对象/数组会就地递归挂载到 parentRow）
    function buildField(parentRow, val, onSet) {
        if (val && typeof val === 'object') {
            if (Array.isArray(val)) {
                if (isObjectArray(val)) buildObjectArray(parentRow, val);
                else buildScalarArray(parentRow, val);
            } else {
                var det = document.createElement('details');
                det.className = 'obj-nested';
                det.open = true;
                var sum = document.createElement('summary');
                sum.className = 'obj-nested-sum';
                sum.textContent = '对象（' + Object.keys(val).length + ' 个键）';
                det.appendChild(sum);
                var inner = document.createElement('div');
                inner.className = 'obj-nested-body';
                buildObjectForm(inner, val);
                det.appendChild(inner);
                parentRow.appendChild(det);
            }
        } else {
            parentRow.appendChild(buildScalar(val, onSet));
        }
    }

    // 构建对象表单（递归）
    function buildObjectForm(parentEl, targetObj) {
        var keys = Object.keys(targetObj);
        for (var ki = 0; ki < keys.length; ki++) {
            (function(key) {
                var val = targetObj[key];
                var row = document.createElement('div');
                row.className = 'obj-row';
                var labelWrap = document.createElement('div');
                labelWrap.className = 'obj-label-wrap';
                var label = document.createElement('label');
                label.className = 'obj-label'; label.textContent = key;
                labelWrap.appendChild(label);
                var del = document.createElement('button');
                del.type = 'button'; del.className = 'obj-row-del'; del.textContent = '×';
                del.title = '删除该字段';
                del.addEventListener('click', async function() {
                    if (await dialog.confirm('确认删除字段「' + key + '」？', '删除字段', true)) { delete targetObj[key]; rebuildAll(); }
                });
                labelWrap.appendChild(del);
                row.appendChild(labelWrap);

                var fieldCell = document.createElement('div');
                fieldCell.className = 'obj-field-cell';
                row.appendChild(fieldCell);
                buildField(fieldCell, val, function(nv) { targetObj[key] = nv; });

                parentEl.appendChild(row);
            })(keys[ki]);
        }
    }

    function rebuildAll() {
        container.innerHTML = '';
        buildToolbar();
        buildObjectForm(container, rootObj);
        emit();
    }

    function buildToolbar() {
        var bar = document.createElement('div');
        bar.className = 'wizard-form-toolbar obj-top-toolbar';
        var keyInp = document.createElement('input');
        keyInp.type = 'text'; keyInp.className = 'form-input form-input-sm obj-addkey';
        keyInp.placeholder = '新字段名';
        var typeSel = document.createElement('select');
        typeSel.className = 'form-input form-input-sm obj-addtype';
        [['string', '文本'], ['number', '数字'], ['boolean', '布尔'], ['object', '对象'], ['array', '数组']].forEach(function(t) {
            var o = document.createElement('option'); o.value = t[0]; o.textContent = t[1]; typeSel.appendChild(o);
        });
        var addBtn = document.createElement('button');
        addBtn.type = 'button'; addBtn.className = 'btn btn-outline btn-sm'; addBtn.textContent = '＋ 新增字段';
        addBtn.addEventListener('click', function() {
            var k = keyInp.value.trim();
            if (!k) { dialog.alert('请输入字段名'); return; }
            if (k in rootObj) { dialog.alert('字段「' + k + '」已存在'); return; }
            rootObj[k] = defaultValueForType(typeSel.value);
            keyInp.value = '';
            rebuildAll();
        });
        bar.appendChild(keyInp);
        bar.appendChild(typeSel);
        bar.appendChild(addBtn);
        container.appendChild(bar);
    }

    rebuildAll();
}

/** 根据图形数据生成 SVG 预览 HTML */
function renderShapePreviewSVG(shape) {
    if (!shape) return '';
    var params = shape.defaultParams || {};
    var type = shape.type;
    var cx = params.x || 0;
    var cy = params.y || 0;
    var r = params.radius || 4;

    var svg = '<svg viewBox="-16 -16 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">';
    svg += '<line x1="-16" y1="0" x2="16" y2="0" stroke="#ddd" stroke-width="0.15" stroke-dasharray="1,2"/>';
    svg += '<line x1="0" y1="-16" x2="0" y2="16" stroke="#ddd" stroke-width="0.15" stroke-dasharray="1,2"/>';
    svg += '<circle cx="0" cy="0" r="0.3" fill="#bbb"/>';
    svg += '<g transform="scale(1,-1)">';

    switch (type) {
        case 'circle':
            svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            break;
        case 'semicircle': {
            var sa = (params.startAngle || 90) * Math.PI / 180;
            var spa = (params.spanAngle || 180) * Math.PI / 180;
            var rot = (params.rotation || 0) * Math.PI / 180;
            var a1 = sa + rot, a2 = sa + spa + rot;
            var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
            var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
            svg += '<path d="M ' + x1 + ',' + y1 + ' A ' + r + ',' + r + ' 0 ' + (spa > Math.PI ? 1 : 0) + ',1 ' + x2 + ',' + y2 + ' L ' + cx + ',' + cy + ' Z" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            break;
        }
        case 'ellipse':
            svg += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (params.rx || 5) + '" ry="' + (params.ry || 3) + '" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            break;
        case 'rect': {
            var w = params.width || 8, h = params.height || 6;
            svg += '<rect x="' + (cx - w/2) + '" y="' + (cy - h/2) + '" width="' + w + '" height="' + h + '" rx="' + (params.rx || 0) + '" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            break;
        }
        case 'line':
            svg += '<line x1="' + (cx + (params.x1 || -4)) + '" y1="' + (cy + (params.y1 || 0)) + '" x2="' + (cx + (params.x2 || 4)) + '" y2="' + (cy + (params.y2 || 0)) + '" stroke="#0078D4" stroke-width="0.45"/>';
            break;
        case 'polygon': {
            var pts = params.points || [];
            if (pts.length) {
                var d = '';
                for (var pi = 0; pi < pts.length; pi++) {
                    d += (pi === 0 ? 'M ' : ' L ') + (cx + pts[pi][0]) + ',' + (cy + pts[pi][1]);
                }
                svg += '<path d="' + d + ' Z" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            }
            break;
        }
        case 'arc': {
            var sa2 = (params.startAngle || 0) * Math.PI / 180;
            var spa2 = (params.spanAngle || 90) * Math.PI / 180;
            var x1a = cx + r * Math.cos(sa2), y1a = cy + r * Math.sin(sa2);
            var x2a = cx + r * Math.cos(sa2 + spa2), y2a = cy + r * Math.sin(sa2 + spa2);
            svg += '<path d="M ' + x1a + ',' + y1a + ' A ' + r + ',' + r + ' 0 ' + (spa2 > Math.PI ? 1 : 0) + ',1 ' + x2a + ',' + y2a + '" fill="none" stroke="#0078D4" stroke-width="0.45"/>';
            break;
        }
        case 'star': {
            var or = params.outerRadius || 5, ir = params.innerRadius || 2.5, np = params.numPoints || 5;
            var sRot = (params.rotation || 0) * Math.PI / 180;
            var d2 = '';
            for (var pi2 = 0; pi2 < np * 2; pi2++) {
                var ang = sRot + pi2 * Math.PI / np - Math.PI / 2;
                d2 += (pi2 === 0 ? 'M ' : ' L ') + (cx + (pi2 % 2 === 0 ? or : ir) * Math.cos(ang)) + ',' + (cy + (pi2 % 2 === 0 ? or : ir) * Math.sin(ang));
            }
            svg += '<path d="' + d2 + ' Z" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            break;
        }
        case 'arrow': {
            var ax1 = params.x1 || -5, ay1 = params.y1 || 0, ax2 = params.x2 || 5, ay2 = params.y2 || 0, hs = params.headSize || 3;
            var dx = ax2 - ax1, dy = ay2 - ay1, len = Math.sqrt(dx*dx + dy*dy) || 1;
            var ux = dx / len, uy = dy / len;
            var pxx = cx + ax2, pyy = cy + ay2;
            svg += '<line x1="' + (cx + ax1) + '" y1="' + (cy + ay1) + '" x2="' + pxx + '" y2="' + pyy + '" stroke="#0078D4" stroke-width="0.45"/>';
            svg += '<polygon points="' + pxx + ',' + pyy + ' ' + (pxx - hs * ux + hs * 0.5 * uy) + ',' + (pyy - hs * uy - hs * 0.5 * ux) + ' ' + (pxx - hs * ux - hs * 0.5 * uy) + ',' + (pyy - hs * uy + hs * 0.5 * ux) + '" fill="#0078D4"/>';
            break;
        }
        case 'cross': {
            var sz = params.size || 4, wd = params.width || 1.5, hw = wd / 2;
            svg += '<rect x="' + (cx - sz) + '" y="' + (cy - hw) + '" width="' + (sz * 2) + '" height="' + wd + '" fill="rgba(0,120,212,0.5)" stroke="#0078D4" stroke-width="0.25"/>';
            svg += '<rect x="' + (cx - hw) + '" y="' + (cy - sz) + '" width="' + wd + '" height="' + (sz * 2) + '" fill="rgba(0,120,212,0.5)" stroke="#0078D4" stroke-width="0.25"/>';
            break;
        }
        case 'diamond': {
            var dw = params.width || 6, dh = params.height || 6;
            svg += '<polygon points="' + cx + ',' + (cy + dh/2) + ' ' + (cx + dw/2) + ',' + cy + ' ' + cx + ',' + (cy - dh/2) + ' ' + (cx - dw/2) + ',' + cy + '" fill="rgba(0,120,212,0.18)" stroke="#0078D4" stroke-width="0.35"/>';
            break;
        }
    }
    svg += '</g></svg>';
    return svg;
}

// ============================================================
// 向导状态
// ============================================================

const wizardState = {
    currentStep: -1,
    generatedData: {},
    isStarted: false,
    currentFormData: null,
};

// ============================================================
// DOM 引用
// ============================================================

let dom = {};

function bindDom() {
    dom = {
        stepTitle: document.getElementById('wizardStepTitle'),
        stepDesc: document.getElementById('wizardStepDesc'),
        stepBody: document.getElementById('wizardStepBody'),
        stepCounter: document.getElementById('wizardStepCounter'),
        generateBtn: document.getElementById('wizardGenerateBtn'),
        saveBtn: document.getElementById('wizardSaveBtn'),
        sidebar: document.getElementById('wizardSidebar'),
    };
}

// ============================================================
// 开始向导（无文件夹选择，直接启动）
// ============================================================

function startWizard() {
    wizardState.isStarted = true;
    wizardState.currentStep = -1; // -1 = 概览模式，显示所有步骤
    updateUI();
}

// ============================================================
// 导航
// ============================================================

function goToStep(index) {
    if (index < 0 || index >= STEPS.length) return;
    wizardState.currentStep = index;
    updateUI();
}

function goPrev() {
    // 返回步骤概览
    wizardState.currentStep = -1;
    updateUI();
}

function goNext() {
    if (wizardState.currentStep < STEPS.length - 1) {
        var step = STEPS[wizardState.currentStep];
        if (!wizardState.generatedData[step.id]) {
            showStatus('请先点击「生成」按钮生成当前步骤的数据', 'warning');
            return;
        }
        goToStep(wizardState.currentStep + 1);
    }
}

function handleGenerate() {
    var step = STEPS[wizardState.currentStep];
    if (!step) return;

    try {
        var data;

        // 表单编辑器步骤：使用 currentFormData
        if (FORM_EDITORS[step.id] && wizardState.currentFormData) {
            data = wizardState.currentFormData;
        } else {
            data = collectStepData(step);
        }

        var jsonStr = JSON.stringify(data, null, 4);
        wizardState.generatedData[step.id] = jsonStr;

        // 表单编辑器步骤更新预览
        var previewEl = document.getElementById('stepPreview');
        if (previewEl) {
            previewEl.textContent = jsonStr;
            previewEl.style.display = 'block';
        }

        var statusEl = document.getElementById('stepStatus');
        if (statusEl) {
            statusEl.textContent = '已生成';
            statusEl.style.color = 'var(--msg-success-text)';
        }

        showStatus(step.id + ' 生成成功', 'success');
        updateNavButtons();
    } catch (e) {
        showStatus('生成失败: ' + e.message, 'error');
    }
}

function collectStepData(step) {
    var textarea = document.getElementById('stepJsonEditor');
    if (!textarea) {
        // 无 textarea（大文件摘要视图 / 尚未渲染）→ 用已生成数据 > 模板缓存 > 内置兜底
        if (wizardState.generatedData[step.id]) {
            try { return JSON.parse(wizardState.generatedData[step.id]); } catch (e) {}
        }
        if (TEMPLATE_CACHE[step.id] != null) return TEMPLATE_CACHE[step.id];
        return step.defaultData;
    }

    try {
        return JSON.parse(textarea.value);
    } catch (e) {
        throw new Error('JSON格式错误: ' + e.message);
    }
}

// ============================================================
// 保存到文件夹
// ============================================================

async function saveAllFiles() {
    var generatedSteps = [];
    for (var i = 0; i < STEPS.length; i++) {
        if (wizardState.generatedData[STEPS[i].id]) {
            generatedSteps.push(STEPS[i]);
        }
    }

    if (generatedSteps.length === 0) {
        showStatus('没有已生成的文件可保存', 'info');
        return;
    }

    if (!(await dialog.confirm('将下载 ' + generatedSteps.length + ' 个 JSON 文件到浏览器下载目录。\n是否继续？'))) return;

    for (var i = 0; i < generatedSteps.length; i++) {
        var step = generatedSteps[i];
        downloadJsonFile(wizardState.generatedData[step.id], step.fileName);
    }
    showStatus('已开始下载 ' + generatedSteps.length + ' 个文件', 'success');
}

/** 通过 Blob 下载单个 JSON 文件 */
function downloadJsonFile(jsonStr, fileName) {
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================
// UI 渲染
// ============================================================

function updateUI() {
    renderSidebar();
    if (wizardState.currentStep < 0) {
        renderPlaceholder();
        if (dom.stepCounter) dom.stepCounter.textContent = '';
    } else {
        renderCurrentStep();
    }
    updateNavButtons();
}

/** 渲染竖排导航栏 */
function renderSidebar() {
    var sidebar = dom.sidebar;
    if (!sidebar) {
        // 兜底：重新查找（防止 init 时 DOM 尚未就绪）
        sidebar = document.getElementById('wizardSidebar');
        if (!sidebar) return;
        dom.sidebar = sidebar;
    }

    var html = '';
    for (var i = 0; i < STEPS.length; i++) {
        var step = STEPS[i];
        var isActive = wizardState.currentStep === i;
        html += '<div class="ws-item' + (isActive ? ' active' : '') + '" data-idx="' + i + '">';
        html += '  <span class="ws-name">' + escapeHtml(step.fileName) + '</span>';
        html += '</div>';
    }
    sidebar.innerHTML = html;

    // 绑定点击事件
    var items = sidebar.querySelectorAll('.ws-item');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            var idx = parseInt(this.dataset.idx);
            wizardState.currentStep = idx;
            updateUI();
        });
    }
}

/** 未选择文件时的占位页面 */
function renderPlaceholder() {
    var body = dom.stepBody;
    if (!body) return;
    if (dom.stepTitle) dom.stepTitle.textContent = '工程创建向导';
    if (dom.stepDesc) dom.stepDesc.textContent = '从左侧导航栏选择一个配置文件开始编辑。编辑后点击「生成」，全部完成后点击「保存到文件夹」。';
    body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">'
        + ''
        + '<div style="font-size:15px;font-weight:500;">选择一个配置文件</div>'
        + '<div style="font-size:12px;margin-top:6px;">从左侧导航栏点击任意文件开始编辑</div>'
        + '</div>';
}

function renderCurrentStep() {
    var step = STEPS[wizardState.currentStep];
    if (!step) return;

    if (dom.stepTitle) dom.stepTitle.textContent = step.title;
    if (dom.stepDesc) dom.stepDesc.textContent = step.description;

    if (dom.stepCounter) {
        dom.stepCounter.textContent = step.fileName;
    }

    renderStepEditor(step);
}

function renderStepEditor(step) {
    var body = dom.stepBody;
    if (!body) return;

    var existingData = wizardState.generatedData[step.id];

    // inlineTemplate 步骤：默认数据已内联在 step.defaultData（仅提炼公共字段 + 5 组真实数据），
    // 无需再 fetch 大文件，直接种子化缓存即可。
    if (step.inlineTemplate && !(step.id in TEMPLATE_CACHE)) {
        TEMPLATE_CACHE[step.id] = (step.defaultData !== undefined ? step.defaultData : null);
    }

    // 尚未生成、且默认模板未加载 → 异步从 templates/ 拉取真实工程配置作为默认值
    if (!existingData && !(step.id in TEMPLATE_CACHE)) {
        if (!TEMPLATE_LOADING[step.id]) {
            TEMPLATE_LOADING[step.id] = true;
            fetch(TEMPLATE_DIR + step.fileName)
                .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function(json) {
                    TEMPLATE_CACHE[step.id] = json;
                    delete TEMPLATE_LOADING[step.id];
                    if (STEPS[wizardState.currentStep] === step) renderStepEditor(step);
                })
                .catch(function(err) {
                    // 加载失败（未通过 http 服务打开 / 文件缺失）→ 回退到内置兜底默认值
                    console.warn('模板加载失败 ' + step.fileName + '：', err);
                    TEMPLATE_CACHE[step.id] = (step.defaultData !== undefined ? step.defaultData : null);
                    delete TEMPLATE_LOADING[step.id];
                    if (STEPS[wizardState.currentStep] === step) renderStepEditor(step);
                });
        }
        body.innerHTML = '<div class="wizard-tpl-loading">正在加载默认模板 <strong>' + escapeHtml(step.fileName) + '</strong> …</div>';
        return;
    }

    // 计算当前步骤数据：已生成 > 模板缓存 > 内置兜底
    var data;
    if (existingData) {
        data = JSON.parse(existingData);
    } else {
        var tpl = TEMPLATE_CACHE[step.id];
        data = (tpl && typeof tpl === 'object') ? JSON.parse(JSON.stringify(tpl)) : tpl;
    }
    var isGenerated = !!existingData;
    var editorType = FORM_EDITORS[step.id];

    // lamp_template：直接关联「灯光图例」编辑器，全屏嵌入 legend_editor.html，
    // 充分展示该网页内容，不显示 JSON 预览区。
    if (editorType === 'legend') {
        // 进入该步骤时，若尚未生成过数据，则用默认数据初始化，保证图例编辑器载入即有内容。
        if (!wizardState.generatedData[step.id]) {
            wizardState.generatedData[step.id] = JSON.stringify(data, null, 4);
        }
        // 用 DOM 方式创建 iframe 并挂载，确保其获得确定高度、可靠渲染（避免 innerHTML 中 iframe 高度坍塌）
        body.innerHTML = '<div class="wizard-editor-split" id="wizardLegendWrap"></div>';
        var wrap = document.getElementById('wizardLegendWrap');
        if (wrap) {
            var frame = document.createElement('iframe');
            frame.className = 'wizard-legend-frame';
            frame.src = 'legend_editor.html';
            frame.setAttribute('title', '灯光图例编辑器');
            wrap.appendChild(frame);
        }
        return;
    }

    // 表单编辑器（中栏 + 右JSON预览）
    if (editorType) {
        // 图形预览区域仅 basic_shapes（object 编辑器）需要；
        // brushes_config / lamp_model_config（array 编辑器）不显示，
        // 让属性配置区域自动撑满至与 JSON 预览区底部平齐。
        var previewPaneHtml = (editorType === 'object')
            ? '        <div class="wizard-editor-preview" id="wizardEditorPreview"></div>'
            : '';

        var html = ''
            + '<div class="wizard-editor-split">'
            + '    <div class="wizard-editor-center">'
            + '        <div class="wizard-editor-form" id="wizardEditorLeft"></div>'
            + previewPaneHtml
            + '    </div>'
            + '    <div class="wizard-editor-right">'
            + '        <div class="wizard-preview-header">JSON 预览 <span style="font-weight:400;font-size:11px;color:var(--text-secondary);">（编辑表单自动更新）</span></div>'
            + '        <pre id="wizardPreview" class="wizard-preview">' + escapeHtml(JSON.stringify(data, null, 4)) + '</pre>'
            + '    </div>'
            + '</div>';

        body.innerHTML = html;
        wizardState.currentFormData = null;

        var leftContainer = document.getElementById('wizardEditorLeft');
        if (leftContainer) {
            var onChange = function(updatedData) {
                var preview = document.getElementById('wizardPreview');
                if (preview) preview.textContent = JSON.stringify(updatedData, null, 4);
                wizardState.currentFormData = updatedData;
                // 自动保存到生成数据，确保新增/修改在侧边栏切换后不丢失
                wizardState.generatedData[step.id] = JSON.stringify(updatedData, null, 4);
                // 同步更新侧边栏状态指示
                renderSidebar();
                updateNavButtons();
            };

            if (editorType === 'object') {
                if (step.id === 'basic_shapes') {
                    renderBasicShapesForm(leftContainer, data, onChange);
                } else {
                    renderGenericObjectEditor(leftContainer, data, onChange);
                }
            } else if (editorType === 'array') {
                var cardOpts = (function() {
                    if (step.id === 'brushes_config') return { fields: BRUSH_FIELDS, cardsClass: 'brush-cards', headFn: function(item, i) { return '<span class="brush-id">' + escapeHtml(item.id || ('#' + (i + 1))) + '</span>'; } };
                    if (step.id === 'lamp_model_config') return { fields: LAMP_MODEL_FIELDS, cardsClass: 'lampmodel-cards', headFn: function(item, i) { return '<span class="brush-id">' + escapeHtml(item.id || ('#' + (i + 1))) + '</span>' + '<span class="lampmodel-name">' + escapeHtml(item.name || '') + '</span>'; } };
                    if (step.id === 'site_config') return { fields: SITE_CONFIG_FIELDS, cardsClass: 'site-cards', headFn: function(item, i) { return '<span class="brush-id">' + escapeHtml(item.id || ('#' + (i + 1))) + '</span>' + '<span class="lampmodel-name">' + escapeHtml(item.name || '') + '</span>'; } };
                    if (step.id === 'runway_config') return { fields: RUNWAY_CONFIG_FIELDS, cardsClass: 'runway-cards', headFn: function(item, i) { return '<span class="brush-id">' + escapeHtml(item.id || ('#' + (i + 1))) + '</span>' + '<span class="lampmodel-name">' + escapeHtml(item.name || '') + '</span>'; } };
                    if (step.id === 'zone_config') return { fields: ZONE_CONFIG_FIELDS, cardsClass: 'zone-cards', headFn: function(item, i) { return '<span class="brush-id">' + escapeHtml(item.id || ('#' + (i + 1))) + '</span>' + '<span class="lampmodel-name">' + escapeHtml(item.name || '') + '</span>'; } };
                    if (step.id === 'soc_config') return { fields: SOC_CONFIG_FIELDS, cardsClass: 'soc-cards', headFn: function(item, i) { return '<span class="brush-id">' + escapeHtml(item.id || ('#' + (i + 1))) + '</span>' + '<span class="lampmodel-name">' + escapeHtml(item.name || '') + '</span>'; } };
                    if (step.id === 'ccr_config') return {
                        fields: TEMPLATE_FIELDS['ccr_config'],
                        cardsClass: 'ccr-cards',
                        pageDesign: true,
                        headFn: function(item, i) {
                            return '<span class="brush-id">' + escapeHtml(item.id != null ? item.id : ('#' + (i + 1))) + '</span>'
                                + (item.name != null && item.name !== '' ? '<span class="lampmodel-name">' + escapeHtml(item.name) + '</span>' : '');
                        }
                    };
                    // 自动提取字段的数组配置（厦门真实工程）：用公共字段生成卡片，卡片头显示 id（+name）
                    if (TEMPLATE_FIELDS[step.id]) return {
                        fields: TEMPLATE_FIELDS[step.id],
                        cardsClass: step.id + '-cards',
                        headFn: function(item, i) {
                            var h = '<span class="brush-id">' + escapeHtml(item.id != null ? item.id : ('#' + (i + 1))) + '</span>';
                            if (item.name != null && item.name !== '') h += '<span class="lampmodel-name">' + escapeHtml(item.name) + '</span>';
                            return h;
                        }
                    };
                    return null;
                })();

                if (cardOpts) {
                    var st = ensureWizardEditorState(step.id, cardOpts.fields, data);
                    var doRender = function() {
                        renderCardArrayEditor(leftContainer, st, onChange, doRender, {
                            cardsClass: cardOpts.cardsClass,
                            headHtml: cardOpts.headFn
                        });
                    };
                    doRender();
                } else {
                    renderArrayFormEditor(leftContainer, data, onChange);
                }
            }
        }
        return;
    }

    // 其他步骤保持 textarea 编辑器
    var jsonStr = JSON.stringify(data, null, 4) || '';
    var countLabel = Array.isArray(data)
        ? (data.length + ' 条记录')
        : (data && typeof data === 'object' ? (Object.keys(data).length + ' 个顶级键') : '—');

    // 大文件保护：序列化后过大（如 6MB+ 的 lamp_unit_config）不塞入 textarea，
    // 否则会卡死浏览器。改用只读摘要卡片，并直接预存为已生成数据以便保存/下一步。
    if (jsonStr.length > LARGE_TEMPLATE_CHARS) {
        if (!existingData) {
            wizardState.generatedData[step.id] = jsonStr;
            isGenerated = true;
        }
        var sizeMB = (jsonStr.length / 1048576).toFixed(2);
        body.innerHTML = ''
            + '<div class="step-editor">'
            + '  <div class="wizard-bigfile">'
            + ''
            + '    <div class="wizard-bigfile-title">' + escapeHtml(step.fileName) + ' 已按默认模板载入</div>'
            + '    <div class="wizard-bigfile-meta">' + countLabel + ' · 约 ' + sizeMB + ' MB · <span style="color:var(--msg-success-text);">已生成</span></div>'
            + '    <div class="wizard-bigfile-tip">该文件体积较大，为保证界面流畅未在此内联编辑。内容已加载为默认模板，保存时将原样输出。如需修改，请用外部编辑器调整后放回工程目录。</div>'
            + '  </div>'
            + '</div>';
        wizardState.currentFormData = null;
        renderSidebar();
        updateNavButtons();
        return;
    }

    var html = ''
        + '<div class="step-editor">'
        + '    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:6px;">'
        + '        <div style="font-size:12px; color:var(--text-secondary);">'
        + '            文件名: <strong>' + escapeHtml(step.fileName) + '</strong>'
        + '            <span id="stepStatus" style="margin-left:12px; font-weight:600; '
        + (isGenerated ? 'color:var(--msg-success-text);">已生成' : 'color:var(--text-secondary);">未生成')
        + '            </span>'
        + '        </div>'
        + '        <div style="font-size:11px; color:var(--text-secondary);">'
        + countLabel
        + '        </div>'
        + '    </div>'
        + '    <textarea id="stepJsonEditor" class="step-json-editor" spellcheck="false">'
        + escapeHtml(jsonStr)
        + '</textarea>'
        + '    <pre id="stepPreview" class="step-preview" style="display:' + (isGenerated ? 'block' : 'none') + ';">'
        + (isGenerated ? escapeHtml(existingData) : '')
        + '    </pre>'
        + '</div>';

    body.innerHTML = html;
    wizardState.currentFormData = null;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function updateNavButtons() {
    var editing = wizardState.currentStep >= 0;

    if (dom.generateBtn) dom.generateBtn.style.display = editing ? '' : 'none';
    if (dom.saveBtn) dom.saveBtn.style.display = wizardState.isStarted ? '' : 'none';

    if (dom.generateBtn && editing) {
        var step = STEPS[wizardState.currentStep];
        if (step && wizardState.generatedData[step.id]) {
            dom.generateBtn.textContent = '重新生成';
        } else {
            dom.generateBtn.textContent = '生成';
        }
    }
}

// ============================================================
// 公开API - 初始化
// ============================================================

export function initWizardPanel() {
    bindDom();

    if (dom.generateBtn) {
        dom.generateBtn.addEventListener('click', handleGenerate);
    }

    if (dom.saveBtn) {
        dom.saveBtn.addEventListener('click', saveAllFiles);
    }

    // 自动启动（直接进入概览，无需点击"开始"）
    startWizard();
}
