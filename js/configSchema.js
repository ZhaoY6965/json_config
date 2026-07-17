// configSchema.js — ALCMS5 配置文件 Schema 定义
// 定义所有20种配置文件的字段、类型、外键关系、中文标签

// ========== 字段类型常量 ==========
export const FieldType = {
    STRING: 'string',
    INT: 'int',
    FLOAT: 'float',
    BOOL: 'bool',
    OBJECT: 'object',
    ARRAY: 'array',
    IP: 'ip',
    PATH: 'path',
    HEX: 'hex',
};

export const DataShape = {
    ARRAY: 'array',
    OBJECT: 'object',
};

// ========== 所有配置Schema ==========
const schemas = {
    site_config: {
        fileName: 'site_config.json',
        label: 'site_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'site_',
        description: 'Airport sites (tower, workstation, etc.)',
        fields: [
            { key: 'id',   label: 'id',   type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name', label: 'name', type: FieldType.STRING, required: true },
            { key: 'type', label: 'type', type: FieldType.INT,    required: true,
              hint: '0=LCC, 1=tower, 2=maintenance, 3=workstation, 4=display, 5=server' },
        ],
    },
    soc_config: {
        fileName: 'soc_config.json',
        label: 'soc_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'soc_',
        description: 'Station Operation Controllers, mounted under sites',
        fields: [
            { key: 'id',      label: 'id',      type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',    label: 'name',    type: FieldType.STRING, required: true },
            { key: 'site_id', label: 'site_id', type: FieldType.STRING, required: true,
              fk: { target: 'site_config', field: 'id', display: 'name' } },
        ],
    },
    ccr_config: {
        fileName: 'ccr_config.json',
        label: 'ccr_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'ccr_',
        description: 'Constant Current Regulators, mounted under SOC (max 4 ch + 1 backup)',
        fields: [
            { key: 'id',        label: 'id',        type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',      label: 'name',      type: FieldType.STRING, required: true },
            { key: 'site_id',   label: 'site_id',   type: FieldType.STRING, required: true,
              fk: { target: 'site_config', field: 'id', display: 'name' } },
            { key: 'steps',     label: 'steps',     type: FieldType.INT,    required: true, default: 6 },
            { key: 'type',      label: 'type',      type: FieldType.STRING, required: true, default: 'CCR',
              options: ['CCR'] },
            { key: 'soc_id',    label: 'soc_id',    type: FieldType.STRING, required: true,
              fk: { target: 'soc_config', field: 'id', display: 'name' } },
            { key: 'soc_index', label: 'soc_index', type: FieldType.INT,    required: true,
              hint: '0~3=working channel, 256=backup' },
            { key: 'cmd_step',  label: 'cmd_step',  type: FieldType.INT,    required: true, default: 0 },
            { key: 'act_step',  label: 'act_step',  type: FieldType.INT,    required: true, default: 0 },
            { key: 'card_row',  label: 'card_row',  type: FieldType.INT,    required: false },
            { key: 'card_colum',label: 'card_colum',type: FieldType.INT,    required: false },
        ],
    },
    circuit_config: {
        fileName: 'circuit_config.json',
        label: 'circuit_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'circuit_',
        description: 'Lighting circuits, each connected to a CCR and a circuit group',
        fields: [
            { key: 'id',           label: 'id',           type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',         label: 'name',         type: FieldType.STRING, required: true },
            { key: 'ccr_id',       label: 'ccr_id',       type: FieldType.STRING, required: true,
              fk: { target: 'ccr_config', field: 'id', display: 'name' } },
            { key: 'site_id',      label: 'site_id',      type: FieldType.STRING, required: true,
              fk: { target: 'site_config', field: 'id', display: 'name' } },
            { key: 'zone_id',      label: 'zone_id',      type: FieldType.STRING, required: false },
            { key: 'select_index', label: 'select_index', type: FieldType.INT,    required: true, default: 0 },
            { key: 'lampnum',      label: 'lampnum',      type: FieldType.INT,    required: true },
            { key: 'lampalarmnum', label: 'lampalarmnum', type: FieldType.INT,    required: true, default: 2 },
            { key: 'group_id',     label: 'group_id',     type: FieldType.STRING, required: true,
              fk: { target: 'circuit_group_config', field: 'id', display: 'name' } },
            { key: 'card_row',  label: 'card_row',  type: FieldType.INT,    required: false },
            { key: 'card_colum',label: 'card_colum',type: FieldType.INT,    required: false },
        ],
    },
    circuit_group_config: {
        fileName: 'circuit_group_config.json',
        label: 'circuit_group_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'cg_',
        description: 'Circuit groups, organized by functional zones',
        fields: [
            { key: 'id',        label: 'id',        type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',      label: 'name',      type: FieldType.STRING, required: true },
            { key: 'site_id',   label: 'site_id',   type: FieldType.STRING, required: false,
              fk: { target: 'site_config', field: 'id', display: 'name' } },
            { key: 'zone_id',   label: 'zone_id',   type: FieldType.STRING, required: true,
              hint: 'zone_rw{N}_d{D}, d0=common, d1=primary, d2=secondary' },
            { key: 'card_id',   label: 'card_id',   type: FieldType.STRING, required: false },
            { key: 'card_row',  label: 'card_row',  type: FieldType.INT,    required: true, default: 0 },
            { key: 'card_colum', label: 'card_colum', type: FieldType.INT,  required: true, default: 0 },
        ],
    },
    circuit_card_config: {
        fileName: 'circuit_card_config.json',
        label: 'circuit_card_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'card_',
        description: 'CCR circuit card mapping (reserved)',
        fields: [],
    },
    user_config: {
        fileName: 'user_config.json',
        label: 'user_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'user_',
        description: 'System users with control and management permissions',
        fields: [
            { key: 'id',          label: 'id',           type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',        label: 'name',         type: FieldType.STRING, required: true },
            { key: 'password',    label: 'password',     type: FieldType.STRING, required: true },
            { key: 'control_auth', label: 'control_auth', type: FieldType.STRING, required: true },
            { key: 'manage_auth', label: 'manage_auth',  type: FieldType.STRING, required: true },
            { key: 'can_login_ids', label: 'can_login_ids', type: FieldType.ARRAY, required: true },
            { key: 'islog',       label: 'islog',        type: FieldType.BOOL,   required: true, default: false },
        ],
    },
    workstation_config: {
        fileName: 'workstation_config.json',
        label: 'workstation_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'ws_',
        description: 'Network nodes: workstation, server, LCC, etc.',
        fields: [
            { key: 'id',           label: 'id',           type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',         label: 'name',         type: FieldType.STRING, required: true },
            { key: 'site_id',      label: 'site_id',      type: FieldType.STRING, required: true,
              fk: { target: 'site_config', field: 'id', display: 'name' } },
            { key: 'priority',     label: 'priority',     type: FieldType.INT,    required: true },
            { key: 'accept_grant', label: 'accept_grant', type: FieldType.BOOL,   required: true },
            { key: 'type',         label: 'type',         type: FieldType.INT,    required: true,
              hint: '0=LCC, 1=tower, 2=maintenance, 3=workstation, 4=display, 5=server' },
            { key: 'netaddr1',     label: 'netaddr1',     type: FieldType.IP,     required: true },
            { key: 'netaddr2',     label: 'netaddr2',     type: FieldType.IP,     required: true },
            { key: 'netaddr3',     label: 'netaddr3',     type: FieldType.STRING, required: true, default: '*' },
        ],
    },
    ctlauth_config: {
        fileName: 'ctlauth_config.json',
        label: 'ctlauth_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'ctlauth_',
        description: 'Runway direction control authorization zones',
        fields: [
            { key: 'id',      label: 'id',      type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',    label: 'name',    type: FieldType.STRING, required: true },
            { key: 'zone_id', label: 'zone_id', type: FieldType.STRING, required: true },
        ],
    },
    runway_config: {
        fileName: 'runway_config.json',
        label: 'runway_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'runway_',
        description: 'Runway definitions with primary/secondary directions and brightness levels',
        fields: [
            { key: 'id',                 label: 'id',                  type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',               label: 'name',                type: FieldType.STRING, required: true },
            { key: 'primary_direction',   label: 'primary_direction',   type: FieldType.STRING, required: true },
            { key: 'secondary_direction', label: 'secondary_direction', type: FieldType.STRING, required: true },
            { key: 'primary_levels',      label: 'primary_levels',      type: FieldType.STRING, required: true,
              hint: 'separated by #' },
            { key: 'secondary_levels',    label: 'secondary_levels',    type: FieldType.STRING, required: true,
              hint: 'separated by #' },
        ],
    },
    app_config: {
        fileName: 'app_config.json',
        label: 'app_config',
        shape: DataShape.OBJECT,
        description: 'ALCMS5 global application settings',
        fields: [
            { key: 'Workstation',   label: 'Workstation',   type: FieldType.STRING, required: true,
              fk: { target: 'workstation_config', field: 'id', display: 'name' } },
            { key: 'Languages',     label: 'Languages',     type: FieldType.ARRAY,  required: true },
            { key: 'ConfigLoadKey', label: 'ConfigLoadKey', type: FieldType.STRING, required: true },
            { key: 'LogConf',       label: 'LogConf',       type: FieldType.OBJECT, required: true },
        ],
    },
    configtool_config: {
        fileName: 'configtool_config.json',
        label: 'configtool_config',
        shape: DataShape.OBJECT,
        description: 'Config tool read/write paths and backup settings',
        fields: [
            { key: 'ConfigLoadPath', label: 'ConfigLoadPath', type: FieldType.PATH, required: true },
            { key: 'ConfigSavePath', label: 'ConfigSavePath', type: FieldType.PATH, required: true },
            { key: 'ConfigBakPath',  label: 'ConfigBakPath',  type: FieldType.PATH, required: true },
            { key: 'EnableBackup',   label: 'EnableBackup',   type: FieldType.BOOL, required: true },
        ],
    },
    lamp_model_config: {
        fileName: 'lamp_model_config.json',
        label: 'lamp_model_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        description: 'Lamp model definitions, linked to lamp template appearance',
        fields: [
            { key: 'id',      label: 'id',      type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',    label: 'name',    type: FieldType.STRING, required: true },
            { key: 'profile', label: 'profile', type: FieldType.STRING, required: true,
              options: ['circle','semicircle','bicircle','rect','sign','guard','line','polygon','arc'] },
            { key: 'color',   label: 'color',   type: FieldType.STRING, required: true,
              hint: 'r=red, g=green, b=blue, y=yellow, w=white' },
        ],
    },
    lamp_template: {
        fileName: 'lamp_template(2).json',
        label: 'lamp_template',
        shape: DataShape.ARRAY,
        idField: 'id',
        description: 'Lamp SVG rendering templates',
        complex: true,
        fields: [
            { key: 'id',           label: 'id',           type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',         label: 'name',         type: FieldType.STRING, required: true },
            { key: 'description',  label: 'description',  type: FieldType.STRING, required: false },
            { key: 'ctlFaceNum',   label: 'ctlFaceNum',   type: FieldType.INT,    required: false, default: 1 },
            { key: 'profile',      label: 'profile',      type: FieldType.ARRAY,  required: true },
            { key: 'seqEnable',    label: 'seqEnable',    type: FieldType.BOOL,   required: false },
            { key: 'seqInterval',  label: 'seqInterval',  type: FieldType.INT,    required: false, default: 800 },
        ],
    },
    brushes_config: {
        fileName: 'brushes_config(2).json',
        label: 'brushes_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'brush_',
        description: 'Light rendering color brush definitions',
        fields: [
            { key: 'id',              label: 'id',              type: FieldType.STRING, required: true, readOnly: true },
            { key: 'fillColor',       label: 'fillColor',       type: FieldType.HEX,    required: true },
            { key: 'strokeColor',     label: 'strokeColor',     type: FieldType.HEX,    required: true },
            { key: 'strokeWidth',     label: 'strokeWidth',     type: FieldType.FLOAT,  required: true },
            { key: 'fillOpacity',     label: 'fillOpacity',     type: FieldType.FLOAT,  required: true },
            { key: 'strokeOpacity',   label: 'strokeOpacity',   type: FieldType.FLOAT,  required: true },
            { key: 'blinkEnable',     label: 'blinkEnable',     type: FieldType.BOOL,   required: true },
            { key: 'blinkIntervalMs', label: 'blinkIntervalMs', type: FieldType.INT,    required: true, default: 700 },
        ],
    },
    render_config: {
        fileName: 'render_config.json',
        label: 'render_config',
        shape: DataShape.OBJECT,
        description: 'Airport map rendering parameters',
        complex: true,
        fields: [
            { key: 'baseMap',    label: 'baseMap',    type: FieldType.OBJECT, required: true },
            { key: 'pointMap',   label: 'pointMap',   type: FieldType.OBJECT, required: true },
            { key: 'circuitMap', label: 'circuitMap', type: FieldType.OBJECT, required: true },
            { key: 'view',       label: 'view',       type: FieldType.OBJECT, required: true },
        ],
    },
    node_config: {
        fileName: 'node_config(2).json',
        label: 'node_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        description: 'Physical lamp position nodes',
        fields: [
            { key: 'id',         label: 'id',         type: FieldType.STRING, required: true, readOnly: true },
            { key: 'segment',    label: 'segment',    type: FieldType.STRING, required: false,
              fk: { target: 'segment_config', field: 'id', display: 'name' } },
            { key: 'face',       label: 'face',       type: FieldType.STRING, required: true,
              options: ['A', 'B'] },
            { key: 'circuit_id', label: 'circuit_id', type: FieldType.STRING, required: true,
              fk: { target: 'circuit_config', field: 'id', display: 'name' } },
        ],
    },
    single_lamp_config: {
        fileName: 'single_lamp_config.json',
        label: 'single_lamp_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        idPrefix: 'sl_',
        description: 'Single lamp to segment/lamp-unit mapping',
        fields: [
            { key: 'id',               label: 'id',               type: FieldType.STRING, required: true, readOnly: true },
            { key: 'segment_id',       label: 'segment_id',       type: FieldType.STRING, required: true,
              fk: { target: 'segment_config', field: 'id', display: 'name' } },
            { key: 'lampunit_id',      label: 'lampunit_id',      type: FieldType.STRING, required: true },
            { key: 'side',             label: 'side',             type: FieldType.STRING, required: false },
            { key: 'index_in_segment', label: 'index_in_segment', type: FieldType.INT,    required: true },
            { key: 'circuit_id',       label: 'circuit_id',       type: FieldType.STRING, required: false,
              fk: { target: 'circuit_config', field: 'id', display: 'name' } },
            { key: 'name',             label: 'name',             type: FieldType.STRING, required: true },
        ],
    },
    single_lamp_position: {
        fileName: 'single_lamp_config(2).json',
        label: 'single_lamp_position',
        shape: DataShape.ARRAY,
        idField: 'id',
        description: 'Single lamp map rendering coordinates and angle',
        fields: [
            { key: 'id',       label: 'id',       type: FieldType.STRING, required: true, readOnly: true },
            { key: 'x',        label: 'x',        type: FieldType.FLOAT,  required: true },
            { key: 'y',        label: 'y',        type: FieldType.FLOAT,  required: true },
            { key: 'angle',    label: 'angle',    type: FieldType.FLOAT,  required: true },
            { key: 'template', label: 'template', type: FieldType.STRING, required: true,
              fk: { target: 'lamp_template', field: 'id', display: 'name' } },
        ],
    },
    segment_config: {
        fileName: 'segment_config.json',
        label: 'segment_config',
        shape: DataShape.ARRAY,
        idField: 'id',
        description: 'Lamp segments (continuous lamp intervals on runway)',
        fields: [
            { key: 'id',           label: 'id',           type: FieldType.STRING, required: true, readOnly: true },
            { key: 'name',         label: 'name',         type: FieldType.STRING, required: true },
            { key: 'circuit_id',   label: 'circuit_id',   type: FieldType.STRING, required: false,
              fk: { target: 'circuit_config', field: 'id', display: 'name' } },
            { key: 'segment_type', label: 'segment_type', type: FieldType.INT,    required: true, default: 0 },
            { key: 'start_x',      label: 'start_x',      type: FieldType.FLOAT,  required: true },
            { key: 'start_y',      label: 'start_y',      type: FieldType.FLOAT,  required: true },
            { key: 'end_x',        label: 'end_x',        type: FieldType.FLOAT,  required: true },
            { key: 'end_y',        label: 'end_y',        type: FieldType.FLOAT,  required: true },
        ],
    },
};


// ========== API ==========

export function getSchemaByFileName(fileName) {
    for (const key of Object.keys(schemas)) {
        if (schemas[key].fileName === fileName) return schemas[key];
    }
    return null;
}


export function getAllSchemas() {
    return Object.entries(schemas).map(([key, s]) => ({ key, ...s }));
}

export function detectConfigType(data) {
    if (!data) return null;
    if (!Array.isArray(data)) {
        if (data.ConfigLoadPath !== undefined) return { key: 'configtool_config', schema: schemas.configtool_config };
        if (data.baseMap !== undefined) return { key: 'render_config', schema: schemas.render_config };
        if (data.Workstation !== undefined || data.ConfigLoadKey !== undefined) return { key: 'app_config', schema: schemas.app_config };
        return null;
    }
    if (data.length === 0) return null;
    const s = data[0];
    const sigs = [
        { has: ['type','site_id'], no: ['steps','priority','soc_id'], match: 'site_config' },
        { has: ['steps','soc_id','soc_index'], match: 'ccr_config' },
        { has: ['ccr_id','lampnum','group_id'], match: 'circuit_config' },
        { has: ['card_id','card_row','card_colum'], match: 'circuit_group_config' },
        { has: ['password','control_auth'], match: 'user_config' },
        { has: ['netaddr1','priority','accept_grant'], match: 'workstation_config' },
        { has: ['zone_id','site_id'], no: ['steps'], match: 'soc_config' },
        { has: ['zone_id'], no: ['site_id'], match: 'ctlauth_config' },
        { has: ['primary_direction','secondary_direction'], match: 'runway_config' },
        { has: ['profile','color'], no: ['ctlFaceNum'], match: 'lamp_model_config' },
        { has: ['ctlFaceNum','profile'], match: 'lamp_template' },
        { has: ['fillColor','strokeColor','blinkEnable'], match: 'brushes_config' },
        { has: ['face','circuit_id','segment'], match: 'node_config' },
        { has: ['segment_id','lampunit_id','index_in_segment'], match: 'single_lamp_config' },
        { has: ['x','y','angle','template'], match: 'single_lamp_position' },
        { has: ['segment_type','start_x','end_x'], match: 'segment_config' },
    ];
    for (const sig of sigs) {
        if (!sig.has.every(k => k in s)) continue;
        if (sig.no && sig.no.some(k => k in s)) continue;
        return { key: sig.match, schema: schemas[sig.match] };
    }
    return null;
}

export function getForeignKeyFields(schemaKey) {
    const schema = schemas[schemaKey];
    if (!schema) return [];
    return schema.fields.filter(f => f.fk);
}



