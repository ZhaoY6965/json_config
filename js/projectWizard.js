// projectWizard.js — 工程创建向导
// 从0起步的机场灯光配置工程创建流程，按 Phase 0~7 共23个JSON步骤逐步生成
import { showStatus } from './core.js';

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
        defaultData: [
            { id: 'ccr_card_1', site_id: 'site_1', name: '调光器卡片1', rows: 11, columns: 11 },
            { id: 'ccr_card_2', site_id: 'site_2', name: '调光器卡片2', rows: 11, columns: 11 },
            { id: 'ccr_card_3', site_id: 'site_3', name: '调光器卡片3', rows: 11, columns: 11 },
            { id: 'ccr_card_4', site_id: 'site_4', name: '调光器卡片4', rows: 11, columns: 11 }
        ]
    },
    {
        id: 'ccr_config',
        phase: 2,
        fileName: 'ccr_config.json',
        title: 'ccr_config.json — 调光器配置',
        description: '定义每个调光器实例，这是核心工作量最大的文件之一。每个调光器关联 SOC 通道和卡片网格位置。',
        defaultData: []
    },

    // ===== Phase 3: 回路 =====
    {
        id: 'circuit_card_config',
        phase: 3,
        fileName: 'circuit_card_config.json',
        title: 'circuit_card_config.json — 回路卡片',
        description: '定义回路分组卡片（用于回路选择面板的布局），包含虚拟网格尺寸和像素位置。',
        defaultData: [
            { id: 'cgd_runway1', name: '跑道1', row: 1, colum: 10, x: 280, y: 50 },
            { id: 'cgd_runway2', name: '跑道2', row: 1, colum: 10, x: 140, y: 900 },
            { id: 'cgd_jjd1',    name: '进近1', row: 1, colum: 1,  x: 150, y: 50 },
            { id: 'cgd_jjd2',    name: '进近2', row: 1, colum: 1,  x: 1450,y: 50 },
            { id: 'cgd_jjd3',    name: '进近3', row: 1, colum: 1,  x: 10,  y: 900 },
            { id: 'cgd_jjd4',    name: '进近4', row: 1, colum: 1,  x: 1310,y: 900 }
        ]
    },
    {
        id: 'circuit_group_config',
        phase: 3,
        fileName: 'circuit_group_config.json',
        title: 'circuit_group_config.json — 回路分组',
        description: '按功能把回路分组，决定回路在UI面板上的排列。共24个分组。',
        defaultData: [
            { id: 'cg_1', name: '07进近',     card_id: 'cgd_jjd1',    card_row: 0, card_colum: 0 },
            { id: 'cg_2', name: '北跑跑道灯',  card_id: 'cgd_runway1', card_row: 0, card_colum: 2 },
            { id: 'cg_3', name: '07坡度灯',    card_id: 'cgd_runway1', card_row: 0, card_colum: 1 }
        ]
    },
    {
        id: 'circuit_config',
        phase: 3,
        fileName: 'circuit_config.json',
        title: 'circuit_config.json — 回路配置',
        description: '定义每个回路（灯串），这是条目最多的文件。关联调光器和回路分组。',
        defaultData: []
    },

    // ===== Phase 4: 灯具分布 =====
    {
        id: 'segment_config',
        phase: 4,
        fileName: 'segment_config.json',
        title: 'segment_config.json — 段配置',
        description: '定义段（从回路到灯具的中间层），每个段对应一个物理线段，包含起点终点坐标。',
        defaultData: []
    },
    {
        id: 'gsegment_config',
        phase: 4,
        fileName: 'GSegment.json',
        title: 'GSegment.json — 段分组',
        description: '定义段的分组归属。',
        defaultData: []
    },
    {
        id: 'node_config',
        phase: 4,
        fileName: 'node_config.json',
        title: 'node_config.json — 节点配置',
        description: '定义节点（灯在段上的连接点），关联段、回路、face方向。',
        defaultData: []
    },
    {
        id: 'single_lamp_config',
        phase: 4,
        fileName: 'single_lamp_config.json',
        title: 'single_lamp_config.json — 单灯配置',
        description: '定义单个灯具实例的位置、角度和模板引用。id 与 node_config 严格一一对应。',
        defaultData: []
    },
    {
        id: 'lamp_unit_config',
        phase: 4,
        fileName: 'lamp_unit_config.json',
        title: 'lamp_unit_config.json — 灯具单元',
        description: '定义灯具单元（型号绑定），关联灯型、回路、顺序。',
        defaultData: []
    },

    // ===== Phase 5: 权限 =====
    {
        id: 'ctlauth_config',
        phase: 5,
        fileName: 'ctlauth_config.json',
        title: 'ctlauth_config.json — 控制权限',
        description: '定义区域控制权限，与 zone_config 一一对应。',
        defaultData: [
            { id: 'ctlauth_1', name: '北跑道 公共',  zone_id: 'zone_rw1_d0' },
            { id: 'ctlauth_2', name: '北跑道 主方向', zone_id: 'zone_rw1_d1' }
        ]
    },

    // ===== Phase 6: 网络 =====
    {
        id: 'tcp_servers',
        phase: 6,
        fileName: 'TcpServers.json',
        title: 'TcpServers.json — TCP服务器配置',
        description: '定义TCP服务器端口和服务地址。',
        defaultData: {
            ports: [
                { alcms: 1235, timeout: 60 },
                { exchange: 1236, timeout: 60 },
                { alarm: 1246, timeout: 60 },
                { asmgcs: 1234, timeout: 60 },
                { database: 1257, timeout: 60 }
            ],
            servers: [{ name: 'ServerA', nets: [{ addr: '10.1.1.21' }] }],
            databases: [{ name: 'DatabaseA', nets: [{ addr: '10.1.1.21' }] }],
            startwait: 3,
            switchover: 1
        }
    },
    {
        id: 'workstation_config',
        phase: 6,
        fileName: 'workstation_config.json',
        title: 'workstation_config.json — 工作站配置',
        description: '定义工作站列表。',
        defaultData: [
            { id: 'ws_11', name: '塔台1', site_id: '', priority: 1, accept_grant: true, type: 1, netaddr1: '192.168.1.11', netaddr2: '192.168.2.11', netaddr3: '*' }
        ]
    },
    {
        id: 'user_config',
        phase: 6,
        fileName: 'user_config.json',
        title: 'user_config.json — 用户配置',
        description: '定义系统用户及其权限。',
        defaultData: [
            { id: 1, name: '管理员', password: '8', control_auth: 0, manage_auth: 0, can_login_ids: [], islog: true },
            { id: 13, name: '1#操作站', password: '1', control_auth: 1, manage_auth: 1, can_login_ids: [], islog: true }
        ]
    },

    // ===== Phase 7: 渲染 =====
    {
        id: 'render_config',
        phase: 7,
        fileName: 'render_config.json',
        title: 'render_config.json — 渲染配置',
        description: '定义底图、灯位图、回路图、视角的参数。偏移量和缩放需要通过反复试调确定。',
        defaultData: {
            baseMap: { imagePath: 'qrc:/Images/XiaMen/airport_background.svg', offsetX: -2048, offsetY: -1336.5, scale: 1, flipX: false, flipY: false },
            pointMap: { lampSizeScale: 0.4, offsetX: -4139.26, offsetY: 2562.1, scale: 0.6988, flipX: false, flipY: true },
            circuitMap: { offsetX: -2606.3, offsetY: -1641, scale: 0.6989, svgPath: 'qrc:/Images/XiaMen/render_circuits.svg', flipX: false, flipY: false },
            view: { offsetX: 184.15, offsetY: 115.80, zoom: 0.241, rotation: 0 }
        }
    }
];

// ============================================================
// 表单编辑器
// ============================================================

/** 注册使用表单编辑器的步骤 */
var FORM_EDITORS = {
    'basic_shapes': 'object',
    'brushes_config': 'array',
    'lamp_model_config': 'array',
    'lamp_template': 'array',
};

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
            delBtn.addEventListener('click', function() {
                if (!selectedKey) return;
                if (!confirm('\u786e\u5b9a\u5220\u9664\u56fe\u5f62 "' + selectedKey + '" \uff1f')) return;
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
            statusEl.textContent = '✔ 已生成';
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
    if (!textarea) return step.defaultData;

    try {
        return JSON.parse(textarea.value);
    } catch (e) {
        throw new Error('JSON格式错误: ' + e.message);
    }
}

// ============================================================
// 保存到文件夹
// ============================================================

function saveAllFiles() {
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

    if (!confirm('将下载 ' + generatedSteps.length + ' 个 JSON 文件到浏览器下载目录。\n是否继续？')) return;

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
    if (!sidebar) return;

    var html = '';
    for (var i = 0; i < STEPS.length; i++) {
        var step = STEPS[i];
        var isGen = !!wizardState.generatedData[step.id];
        var isActive = wizardState.currentStep === i;
        html += '<div class="ws-item' + (isActive ? ' active' : '') + '" data-idx="' + i + '">';
        html += '  <span class="ws-status ' + (isGen ? 'gen' : 'pending') + '">' + (isGen ? '✔' : '○') + '</span>';
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
        + '<div style="font-size:32px;margin-bottom:12px;">📂</div>'
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
    var data = existingData ? JSON.parse(existingData) : (step.defaultData && typeof step.defaultData === 'object' ? JSON.parse(JSON.stringify(step.defaultData)) : step.defaultData);
    var isGenerated = !!existingData;
    var editorType = FORM_EDITORS[step.id];

    // 表单编辑器（中栏 + 右JSON预览）
    if (editorType) {
        var html = ''
            + '<div class="wizard-editor-split">'
            + '    <div class="wizard-editor-center">'
            + '        <div class="wizard-editor-form" id="wizardEditorLeft"></div>'
            + '        <div class="wizard-editor-preview" id="wizardEditorPreview"></div>'
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
                renderBasicShapesForm(leftContainer, data, onChange);
            } else if (editorType === 'array') {
                renderArrayFormEditor(leftContainer, data, onChange);
            }
        }
        return;
    }

    // 其他步骤保持 textarea 编辑器
    var html = ''
        + '<div class="step-editor">'
        + '    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:6px;">'
        + '        <div style="font-size:12px; color:var(--text-secondary);">'
        + '            文件名: <strong>' + escapeHtml(step.fileName) + '</strong>'
        + '            <span id="stepStatus" style="margin-left:12px; font-weight:600; '
        + (isGenerated ? 'color:var(--msg-success-text);">✔ 已生成' : 'color:var(--text-secondary);">未生成')
        + '            </span>'
        + '        </div>'
        + '        <div style="font-size:11px; color:var(--text-secondary);">'
        + (Array.isArray(data) ? data.length + ' 条记录' : Object.keys(data).length + ' 个顶级键')
        + '        </div>'
        + '    </div>'
        + '    <textarea id="stepJsonEditor" class="step-json-editor" spellcheck="false">'
        + escapeHtml(JSON.stringify(data, null, 4))
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
