// templateFields.js — 自动提取的数组配置「公共扁平字段」与「默认5组真实数据」
// 由厦门真实工程配置生成：只暴露公共扁平字段为可编辑项，嵌套结构在数据中保留但不在卡片中展开。
export const TEMPLATE_FIELDS = {
    "ccr_card_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "site_id",
            "label": "site_id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "rows",
            "label": "rows",
            "type": "number"
        },
        {
            "key": "columns",
            "label": "columns",
            "type": "number"
        }
    ],
    "ccr_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "site_id",
            "label": "site_id",
            "type": "text"
        },
        {
            "key": "steps",
            "label": "steps",
            "type": "number"
        },
        {
            "key": "type",
            "label": "type",
            "type": "text"
        },
        {
            "key": "soc_id",
            "label": "soc_id",
            "type": "text"
        },
        {
            "key": "soc_index",
            "label": "soc_index",
            "type": "number"
        },
        {
            "key": "cmd_step",
            "label": "cmd_step",
            "type": "number"
        },
        {
            "key": "act_step",
            "label": "act_step",
            "type": "number"
        },
        {
            "key": "card_id",
            "label": "card_id",
            "type": "text"
        },
        {
            "key": "card_row",
            "label": "card_row",
            "type": "number"
        },
        {
            "key": "card_colum",
            "label": "card_colum",
            "type": "number"
        }
    ],
    "circuit_card_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "row",
            "label": "row",
            "type": "number"
        },
        {
            "key": "colum",
            "label": "colum",
            "type": "number"
        },
        {
            "key": "x",
            "label": "x",
            "type": "number"
        },
        {
            "key": "y",
            "label": "y",
            "type": "number"
        }
    ],
    "circuit_group_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "site_id",
            "label": "site_id",
            "type": "text"
        },
        {
            "key": "zone_id",
            "label": "zone_id",
            "type": "text"
        },
        {
            "key": "card_id",
            "label": "card_id",
            "type": "text"
        },
        {
            "key": "row",
            "label": "row",
            "type": "number"
        },
        {
            "key": "colum",
            "label": "column",
            "type": "number"
        }
    ],
    "circuit_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "ccr_id",
            "label": "ccr_id",
            "type": "text"
        },
        {
            "key": "site_id",
            "label": "site_id",
            "type": "text"
        },
        {
            "key": "zone_id",
            "label": "zone_id",
            "type": "text"
        },
        {
            "key": "select_index",
            "label": "select_index",
            "type": "number"
        },
        {
            "key": "lampnum",
            "label": "lampnum",
            "type": "number"
        },
        {
            "key": "lampalarmnum",
            "label": "lampalarmnum",
            "type": "number"
        },
        {
            "key": "group_id",
            "label": "group_id",
            "type": "text"
        }
    ],
    "segment_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "circuit_id",
            "label": "circuit_id",
            "type": "text"
        },
        {
            "key": "segment_type",
            "label": "segment_type",
            "type": "number"
        },
        {
            "key": "start_x",
            "label": "start_x",
            "type": "number"
        },
        {
            "key": "start_y",
            "label": "start_y",
            "type": "number"
        },
        {
            "key": "end_x",
            "label": "end_x",
            "type": "number"
        },
        {
            "key": "end_y",
            "label": "end_y",
            "type": "number"
        }
    ],
    "gsegment_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "group_id",
            "label": "group_id",
            "type": "text"
        }
    ],
    "node_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "segment_id",
            "label": "segment_id",
            "type": "text"
        },
        {
            "key": "face",
            "label": "face",
            "type": "text"
        },
        {
            "key": "circuit_id",
            "label": "circuit_id",
            "type": "text"
        }
    ],
    "single_lamp_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "x",
            "label": "x",
            "type": "number"
        },
        {
            "key": "y",
            "label": "y",
            "type": "number"
        },
        {
            "key": "angle",
            "label": "angle",
            "type": "number"
        },
        {
            "key": "template",
            "label": "template",
            "type": "text"
        }
    ],
    "lamp_unit_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "model_id",
            "label": "model_id",
            "type": "text"
        },
        {
            "key": "category",
            "label": "category",
            "type": "number"
        },
        {
            "key": "x",
            "label": "x",
            "type": "number"
        },
        {
            "key": "y",
            "label": "y",
            "type": "number"
        },
        {
            "key": "angle",
            "label": "angle",
            "type": "number"
        },
        {
            "key": "circuit_id",
            "label": "circuit_id",
            "type": "text"
        },
        {
            "key": "index_in_circuit",
            "label": "index_in_circuit",
            "type": "number"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        }
    ],
    "ctlauth_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "zone_id",
            "label": "zone_id",
            "type": "text"
        }
    ],
    "workstation_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "site_id",
            "label": "site_id",
            "type": "text"
        },
        {
            "key": "priority",
            "label": "priority",
            "type": "number"
        },
        {
            "key": "accept_grant",
            "label": "accept_grant",
            "type": "boolean"
        },
        {
            "key": "type",
            "label": "type",
            "type": "number"
        },
        {
            "key": "netaddr1",
            "label": "netaddr1",
            "type": "text"
        },
        {
            "key": "netaddr2",
            "label": "netaddr2",
            "type": "text"
        },
        {
            "key": "netaddr3",
            "label": "netaddr3",
            "type": "text"
        }
    ],
    "user_config": [
        {
            "key": "id",
            "label": "id",
            "type": "text"
        },
        {
            "key": "name",
            "label": "name",
            "type": "text"
        },
        {
            "key": "password",
            "label": "password",
            "type": "text"
        },
        {
            "key": "control_auth",
            "label": "control_auth",
            "type": "number"
        },
        {
            "key": "manage_auth",
            "label": "manage_auth",
            "type": "number"
        },
        {
            "key": "islog",
            "label": "islog",
            "type": "boolean"
        }
    ]
};

export const TEMPLATE_DEFAULTS = {
    "ccr_card_config": [
        {
            "id": "ccr_card_1",
            "site_id": "site_1",
            "name": "调光器卡片1",
            "rows": 11,
            "columns": 11
        },
        {
            "id": "ccr_card_2",
            "site_id": "site_2",
            "name": "调光器卡片2",
            "rows": 11,
            "columns": 11
        },
        {
            "id": "ccr_card_3",
            "site_id": "site_3",
            "name": "调光器卡片3",
            "rows": 11,
            "columns": 11
        },
        {
            "id": "ccr_card_4",
            "site_id": "site_4",
            "name": "调光器卡片4",
            "rows": 11,
            "columns": 11
        }
    ],
    "ccr_config": [
        {
            "id": "ccr_1",
            "name": "西北进近灯1",
            "site_id": "site_1",
            "steps": 5,
            "type": "CCR",
            "soc_id": "soc_1",
            "soc_index": 0,
            "cmd_step": 0,
            "act_step": 0,
            "card_id": "ccr_card_1",
            "card_row": 10,
            "card_colum": 0
        },
        {
            "id": "ccr_2",
            "name": "西北跑道中线灯1",
            "site_id": "site_1",
            "steps": 5,
            "type": "CCR",
            "soc_id": "soc_1",
            "soc_index": 1,
            "cmd_step": 0,
            "act_step": 0,
            "card_id": "ccr_card_1",
            "card_row": 9,
            "card_colum": 0
        },
        {
            "id": "ccr_3",
            "name": "西北侧边灯1",
            "site_id": "site_1",
            "steps": 5,
            "type": "CCR",
            "soc_id": "soc_1",
            "soc_index": 2,
            "cmd_step": 0,
            "act_step": 0,
            "card_id": "ccr_card_1",
            "card_row": 8,
            "card_colum": 0
        },
        {
            "id": "ccr_4",
            "name": "西北接地带灯1",
            "site_id": "site_1",
            "steps": 5,
            "type": "CCR",
            "soc_id": "soc_1",
            "soc_index": 3,
            "cmd_step": 0,
            "act_step": 0,
            "card_id": "ccr_card_1",
            "card_row": 7,
            "card_colum": 0
        },
        {
            "id": "ccr_5",
            "name": "1#备机1",
            "site_id": "site_1",
            "steps": 5,
            "type": "CCR",
            "soc_id": "soc_1",
            "soc_index": 256,
            "cmd_step": 0,
            "act_step": 0,
            "card_id": "ccr_card_1",
            "card_row": 6,
            "card_colum": 0
        }
    ],
    "circuit_card_config": [
        {
            "id": "cgd_runway1",
            "name": "跑道1",
            "row": 1,
            "colum": 10,
            "x": 280,
            "y": 50
        },
        {
            "id": "cgd_runway2",
            "name": "跑道2",
            "row": 1,
            "colum": 10,
            "x": 140,
            "y": 900
        },
        {
            "id": "cgd_jjd1",
            "name": "进近1",
            "row": 1,
            "colum": 1,
            "x": 150,
            "y": 50
        },
        {
            "id": "cgd_jjd2",
            "name": "进近2",
            "row": 1,
            "colum": 1,
            "x": 1450,
            "y": 50
        },
        {
            "id": "cgd_jjd3",
            "name": "进近3",
            "row": 1,
            "colum": 1,
            "x": 10,
            "y": 900
        }
    ],
    "circuit_group_config": [
        {
            "id": "cg_1",
            "name": "07进近",
            "site_id": "",
            "zone_id": "",
            "card_id": "cgd_jjd1",
            "card_row": 0,
            "card_colum": 0
        },
        {
            "id": "cg_2",
            "name": "北跑跑道灯",
            "site_id": "",
            "zone_id": "",
            "card_id": "cgd_runway1",
            "card_row": 0,
            "card_colum": 2
        },
        {
            "id": "cg_3",
            "name": "07坡度灯",
            "site_id": "",
            "zone_id": "",
            "card_id": "cgd_runway1",
            "card_row": 0,
            "card_colum": 1
        },
        {
            "id": "cg_4",
            "name": "北跑警戒灯",
            "site_id": "",
            "zone_id": "",
            "card_id": "cgd_runway1",
            "card_row": 0,
            "card_colum": 6
        },
        {
            "id": "cg_5",
            "name": "北跑停止排灯",
            "site_id": "",
            "zone_id": "",
            "card_id": "cgd_runway1",
            "card_row": 0,
            "card_colum": 4
        }
    ],
    "circuit_config": [
        {
            "id": "CIR_北入口1",
            "name": "西北进近灯1",
            "ccr_id": "ccr_1",
            "site_id": "site_1",
            "zone_id": "",
            "select_index": 0,
            "lampnum": 30,
            "lampalarmnum": 2,
            "group_id": "cg_1"
        },
        {
            "id": "circuit_2",
            "name": "西北跑道中线灯1",
            "ccr_id": "ccr_2",
            "site_id": "site_1",
            "zone_id": "",
            "select_index": 0,
            "lampnum": 30,
            "lampalarmnum": 2,
            "group_id": "cg_2"
        },
        {
            "id": "circuit_3",
            "name": "西北侧边灯1",
            "ccr_id": "ccr_3",
            "site_id": "site_1",
            "zone_id": "",
            "select_index": 0,
            "lampnum": 30,
            "lampalarmnum": 2,
            "group_id": "cg_1"
        },
        {
            "id": "circuit_4",
            "name": "西北接地带灯1",
            "ccr_id": "ccr_4",
            "site_id": "site_1",
            "zone_id": "",
            "select_index": 0,
            "lampnum": 30,
            "lampalarmnum": 2,
            "group_id": "cg_1"
        },
        {
            "id": "circuit_7",
            "name": "西北跑道入口灯1",
            "ccr_id": "ccr_8",
            "site_id": "site_1",
            "zone_id": "",
            "select_index": 0,
            "lampnum": 30,
            "lampalarmnum": 2,
            "group_id": "cg_1"
        }
    ],
    "segment_config": [
        {
            "id": "SEG_3600DA",
            "name": "",
            "circuit_id": "",
            "segment_type": 0,
            "start_x": 0,
            "start_y": 0,
            "end_x": 0,
            "end_y": 0
        },
        {
            "id": "SEG_3601DA",
            "name": "",
            "circuit_id": "",
            "segment_type": 0,
            "start_x": 0,
            "start_y": 0,
            "end_x": 0,
            "end_y": 0
        },
        {
            "id": "SEG_3602DA",
            "name": "",
            "circuit_id": "",
            "segment_type": 0,
            "start_x": 0,
            "start_y": 0,
            "end_x": 0,
            "end_y": 0
        },
        {
            "id": "SEG_3603DA",
            "name": "",
            "circuit_id": "",
            "segment_type": 0,
            "start_x": 0,
            "start_y": 0,
            "end_x": 0,
            "end_y": 0
        },
        {
            "id": "SEG_3604DA",
            "name": "",
            "circuit_id": "",
            "segment_type": 0,
            "start_x": 0,
            "start_y": 0,
            "end_x": 0,
            "end_y": 0
        }
    ],
    "gsegment_config": [
        {
            "id": "段1",
            "group_id": "SEG_01TC"
        },
        {
            "id": "段2",
            "group_id": "SEG_01TC"
        },
        {
            "id": "段3",
            "group_id": "SEG_01TC"
        },
        {
            "id": "段4",
            "group_id": "SEG_01TC"
        },
        {
            "id": "段5",
            "group_id": "SEG_01TC"
        }
    ],
    "node_config": [
        {
            "id": "1B1_A",
            "segment_id": "段1",
            "face": "A",
            "circuit_id": "circuit_185"
        },
        {
            "id": "1B1_B",
            "segment_id": "段2",
            "face": "B",
            "circuit_id": "circuit_185"
        },
        {
            "id": "3B1_A",
            "segment_id": "段3",
            "face": "A",
            "circuit_id": "circuit_185"
        },
        {
            "id": "3B1_B",
            "segment_id": "段4",
            "face": "B",
            "circuit_id": "circuit_185"
        },
        {
            "id": "5B1_A",
            "segment_id": "段5",
            "face": "A",
            "circuit_id": "circuit_185"
        }
    ],
    "single_lamp_config": [
        {
            "id": "1B1_A",
            "x": 4012,
            "y": 2207.5,
            "angle": 90,
            "template": "HZ_Q_GG"
        },
        {
            "id": "1B1_B",
            "x": 4012,
            "y": 2207.5,
            "angle": 270,
            "template": "HZ_Q_GG"
        },
        {
            "id": "3B1_A",
            "x": 4012,
            "y": 2192.5,
            "angle": 90,
            "template": "HZ_Q_GG"
        },
        {
            "id": "3B1_B",
            "x": 4012,
            "y": 2192.5,
            "angle": 270,
            "template": "HZ_Q_GG"
        },
        {
            "id": "5B1_A",
            "x": 4012,
            "y": 2177.5,
            "angle": 90,
            "template": "HZ_Q_GG"
        }
    ],
    "lamp_unit_config": [
        {
            "id": "lu_WNAP166",
            "model_id": "JJD",
            "category": 0,
            "x": 3530,
            "y": 4251,
            "angle": 180,
            "circuit_id": "circuit_1",
            "index_in_circuit": 0,
            "name": "WNAP166"
        },
        {
            "id": "lu_WNAP33",
            "model_id": "JJD",
            "category": 0,
            "x": 4250.0024,
            "y": 4244.0193,
            "angle": 180,
            "circuit_id": "circuit_1",
            "index_in_circuit": 0,
            "name": "WNAP33"
        },
        {
            "id": "lu_WNAP22",
            "model_id": "JJD",
            "category": 0,
            "x": 4250.0322,
            "y": 4254.9416,
            "angle": 180,
            "circuit_id": "circuit_1",
            "index_in_circuit": 0,
            "name": "WNAP22"
        },
        {
            "id": "lu_WNAP21",
            "model_id": "JJD",
            "category": 0,
            "x": 4250.0322,
            "y": 4255.9416,
            "angle": 180,
            "circuit_id": "circuit_1",
            "index_in_circuit": 0,
            "name": "WNAP21"
        },
        {
            "id": "lu_WNAP89",
            "model_id": "JJD",
            "category": 0,
            "x": 4010,
            "y": 4248,
            "angle": 180,
            "circuit_id": "circuit_1",
            "index_in_circuit": 0,
            "name": "WNAP89"
        }
    ],
    "ctlauth_config": [
        {
            "id": "ctlauth_1",
            "name": "北跑道 公共",
            "zone_id": "zone_rw1_d0"
        },
        {
            "id": "ctlauth_2",
            "name": "北跑道 主方向",
            "zone_id": "zone_rw1_d1"
        },
        {
            "id": "ctlauth_3",
            "name": "北跑道 次方向",
            "zone_id": "zone_rw1_d2"
        },
        {
            "id": "ctlauth_4",
            "name": "南跑道 公共",
            "zone_id": "zone_rw2_d0"
        },
        {
            "id": "ctlauth_5",
            "name": "南跑道 主方向",
            "zone_id": "zone_rw2_d1"
        }
    ],
    "workstation_config": [
        {
            "id": "ws_11",
            "name": "塔台1",
            "site_id": "",
            "priority": 1,
            "accept_grant": true,
            "type": 1,
            "netaddr1": "192.168.1.11",
            "netaddr2": "192.168.2.11",
            "netaddr3": "*"
        },
        {
            "id": "ws_12",
            "name": "塔台2",
            "site_id": "",
            "priority": 1,
            "accept_grant": true,
            "type": 1,
            "netaddr1": "192.168.1.12",
            "netaddr2": "192.168.2.12",
            "netaddr3": "*"
        },
        {
            "id": "ws_21",
            "name": "运控中心维修1",
            "site_id": "",
            "priority": 2,
            "accept_grant": true,
            "type": 2,
            "netaddr1": "192.168.1.21",
            "netaddr2": "192.168.2.21",
            "netaddr3": "*"
        },
        {
            "id": "ws_22",
            "name": "运控中心维修2",
            "site_id": "",
            "priority": 2,
            "accept_grant": true,
            "type": 2,
            "netaddr1": "192.168.1.22",
            "netaddr2": "192.168.2.22",
            "netaddr3": "*"
        },
        {
            "id": "ws_23",
            "name": "运控中心大屏",
            "site_id": "",
            "priority": 0,
            "accept_grant": false,
            "type": 4,
            "netaddr1": "192.168.1.23",
            "netaddr2": "192.168.2.23",
            "netaddr3": "*"
        }
    ],
    "user_config": [
        {
            "id": 1,
            "name": "管理员",
            "password": "8",
            "control_auth": 0,
            "manage_auth": 0,
            "can_login_ids": [],
            "islog": true
        },
        {
            "id": 13,
            "name": "1#操作站",
            "password": "1",
            "control_auth": 1,
            "manage_auth": 1,
            "can_login_ids": [],
            "islog": true
        },
        {
            "id": 14,
            "name": "2#操作站",
            "password": "1",
            "control_auth": 1,
            "manage_auth": 1,
            "can_login_ids": [],
            "islog": true
        },
        {
            "id": 15,
            "name": "运控中心",
            "password": "1",
            "control_auth": 1,
            "manage_auth": 1,
            "can_login_ids": [],
            "islog": true
        },
        {
            "id": 16,
            "name": "维修中心",
            "password": "1",
            "control_auth": 1,
            "manage_auth": 1,
            "can_login_ids": [],
            "islog": true
        }
    ]
};

// 对象类型配置（非数组）的真实默认数据，供通用对象编辑器内联使用（标记 inlineTemplate）
export const TEMPLATE_OBJECTS = {
    "module_config": {
        "modules": [
            {
                "id": "module_light",
                "name": "灯光",
                "icon": "qrc:/Images/ModuleIcons/module_light.svg",
                "pageSource": "qrc:/Pages/Light/LightPage.qml",
                "enabled": true,
                "description": "灯光以及回路的实时消息页面"
            },
            {
                "id": "module_alert",
                "name": "报警",
                "icon": "qrc:/Images/ModuleIcons/module_alert.svg",
                "pageSource": "qrc:/Pages/Alert/AlertPage.qml",
                "enabled": true,
                "description": "实时报警页面"
            },
            {
                "id": "module_ccr",
                "name": "调光器",
                "icon": "qrc:/Images/ModuleIcons/module_ccr.svg",
                "pageSource": "qrc:/Pages/Ccr/CcrPage.qml",
                "enabled": true,
                "description": "调光器状态及控制页面"
            },
            {
                "id": "module_network",
                "name": "网络",
                "icon": "qrc:/Images/ModuleIcons/module_network.svg",
                "pageSource": "qrc:/Pages/NetWork/NetworkPage.qml",
                "enabled": true,
                "description": "网络状态监视页面"
            },
            {
                "id": "module_data",
                "name": "数据",
                "icon": "qrc:/Images/ModuleIcons/module_data.svg",
                "pageSource": "qrc:/Pages/Data/DataPage.qml",
                "enabled": true,
                "description": "数据查询页面"
            },
            {
                "id": "module_singlelamp",
                "name": "单灯",
                "icon": "qrc:/Images/ModuleIcons/module_singlelamp.svg",
                "pageSource": "qrc:/Pages/SingleLamp/SingleLampPage.qml",
                "enabled": true,
                "description": "单灯监视页面"
            },
            {
                "id": "module_setting",
                "name": "设置",
                "icon": "qrc:/Images/ModuleIcons/module_setting.svg",
                "pageSource": "qrc:/Pages/Setting/SettingPage.qml",
                "enabled": true,
                "description": "设置页面"
            },
            {
                "id": "module_power",
                "name": "电力",
                "icon": "qrc:/Images/ModuleIcons/module_power.svg",
                "pageSource": "qrc:/Pages/Power/PowerPage.qml",
                "enabled": true,
                "description": "油机电力监视页面"
            },
            {
                "id": "module_papi",
                "name": "PAPI",
                "icon": "qrc:/Images/ModuleIcons/module_papi.svg",
                "pageSource": "qrc:/Pages/PAPI/PapiPage.qml",
                "enabled": true,
                "description": "PAPI监视页面"
            },
            {
                "id": "module_io",
                "name": "IO",
                "icon": "qrc:/Images/ModuleIcons/module_io.svg",
                "pageSource": "qrc:/Pages/IO/IOPage.qml",
                "enabled": true,
                "description": "IO监视页面"
            }
        ]
    },
    "app_config": {
        "Workstation": "1#station",
        "Languages": [
            "zh-CN",
            "en-US",
            "en-GB",
            "ja-JP"
        ],
        "ConfigLoadKey": "XiaMen",
        "LogConf": {
            "FileMinLevel": "DEBUG",
            "ConsoleMinLevel": "DEBUG",
            "Console": true,
            "LogPath": "Logs",
            "FileName": "AlcmsLog",
            "MaxSizeMB": 50,
            "MaxBackups": 100,
            "RollPolicy": "both",
            "AutoClean": true,
            "RetainDays": 7,
            "MaxQueueSize": 100000
        }
    },
    "tcp_servers": {
        "ports": [
            {
                "alcms": 1235,
                "timeout": 60
            },
            {
                "exchange": 1236,
                "timeout": 60
            },
            {
                "alarm": 1246,
                "timeout": 60
            },
            {
                "asmgcs": 1234,
                "timeout": 60
            },
            {
                "database": 1257,
                "timeout": 60
            }
        ],
        "servers": [
            {
                "name": "ServerA",
                "nets": [
                    {
                        "addr": "10.1.1.21"
                    }
                ]
            }
        ],
        "databases": [
            {
                "name": "DatabaseA",
                "nets": [
                    {
                        "addr": "10.1.1.21"
                    }
                ]
            }
        ],
        "startwait": 3,
        "switchover": 1
    },
    "render_config": {
        "baseMap": {
            "flipX": false,
            "flipY": false,
            "imagePath": "qrc:/Images/XiaMen/airport_background.svg",
            "offsetX": -2048,
            "offsetY": -1336.5,
            "scale": 1
        },
        "pointMap": {
            "flipX": false,
            "flipY": true,
            "lampSizeScale": 0.4,
            "offsetX": -4139.26,
            "offsetY": 2562.1,
            "scale": 0.6988
        },
        "circuitMap": {
            "flipX": false,
            "flipY": false,
            "offsetX": -2606.3,
            "offsetY": -1641,
            "scale": 0.6989,
            "svgPath": "qrc:/Images/XiaMen/render_circuits.svg"
        },
        "view": {
            "offsetX": 184.1523219844968,
            "offsetY": 115.80467572107781,
            "rotation": 0,
            "rotationX": 0,
            "rotationY": 0,
            "zoom": 0.24100869036644706
        }
    }
};
