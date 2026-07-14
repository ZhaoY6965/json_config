/**
 * localStore.js
 * 本地文件夹存储模块 -- 基于 File System Access API + IndexedDB 持久化
 *
 * 功能：
 *   1. 检测浏览器是否支持 File System Access API
 *   2. 通过 IndexedDB 持久化目录句柄（FileSystemDirectoryHandle）
 *   3. 对本地文件夹中的模板 JSON 文件进行增删查操作
 */

// ======================== 常量 ========================

var DB_NAME = 'config_tools_db';
var DB_VERSION = 1;
var STORE_NAME = 'handles';
var HANDLE_KEY = 'template_folder';

// ======================== 功能检测 ========================

/**
 * 检测当前浏览器是否支持 File System Access API（showDirectoryPicker）
 * @returns {boolean}
 */
export function isFileSystemAccessSupported() {
    return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

// ======================== IndexedDB 内部辅助函数 ========================

/**
 * 打开 IndexedDB 数据库，返回 Promise<IDBDatabase>
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    return new Promise(function (resolve, reject) {
        try {
            var request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = function (event) {
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                console.error('[localStore] 打开 IndexedDB 失败:', event.target.error);
                reject(event.target.error);
            };
        } catch (err) {
            console.error('[localStore] openDB 异常:', err);
            reject(err);
        }
    });
}

/**
 * 将 FileSystemDirectoryHandle 保存到 IndexedDB
 * @param {FileSystemDirectoryHandle} handle
 * @returns {Promise<void>}
 */
function saveHandleToDB(handle) {
    return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            try {
                var tx = db.transaction(STORE_NAME, 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var request = store.put(handle, HANDLE_KEY);

                request.onsuccess = function () {
                    resolve();
                };

                request.onerror = function (event) {
                    console.error('[localStore] 保存句柄到 IndexedDB 失败:', event.target.error);
                    reject(event.target.error);
                };

                tx.oncomplete = function () {
                    db.close();
                };
            } catch (err) {
                console.error('[localStore] saveHandleToDB 异常:', err);
                reject(err);
            }
        });
    });
}

/**
 * 从 IndexedDB 中取出已保存的 FileSystemDirectoryHandle
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
function getHandleFromDB() {
    return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            try {
                var tx = db.transaction(STORE_NAME, 'readonly');
                var store = tx.objectStore(STORE_NAME);
                var request = store.get(HANDLE_KEY);

                request.onsuccess = function (event) {
                    var result = event.target.result;
                    db.close();
                    if (result) {
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = function (event) {
                    console.error('[localStore] 从 IndexedDB 读取句柄失败:', event.target.error);
                    db.close();
                    reject(event.target.error);
                };
            } catch (err) {
                console.error('[localStore] getHandleFromDB 异常:', err);
                db.close();
                reject(err);
            }
        });
    });
}

/**
 * 从 IndexedDB 中删除已保存的句柄
 * @returns {Promise<void>}
 */
function removeHandleFromDB() {
    return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            try {
                var tx = db.transaction(STORE_NAME, 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var request = store.delete(HANDLE_KEY);

                request.onsuccess = function () {
                    resolve();
                };

                request.onerror = function (event) {
                    console.error('[localStore] 从 IndexedDB 删除句柄失败:', event.target.error);
                    reject(event.target.error);
                };

                tx.oncomplete = function () {
                    db.close();
                };
            } catch (err) {
                console.error('[localStore] removeHandleFromDB 异常:', err);
                reject(err);
            }
        });
    });
}

// ======================== 目录管理 ========================

/**
 * 弹出系统目录选择对话框，用户选择后将句柄持久化到 IndexedDB
 * @returns {Promise<boolean>} 选择并保存成功返回 true，用户取消或出错返回 false
 */
export function selectFolder() {
    if (!isFileSystemAccessSupported()) {
        console.error('[localStore] 当前浏览器不支持 File System Access API');
        return Promise.resolve(false);
    }

    return window.showDirectoryPicker({ mode: 'readwrite' })
        .then(function (handle) {
            return saveHandleToDB(handle).then(function () {
                return true;
            });
        })
        .catch(function (err) {
            // 用户主动取消时 AbortError 属于正常流程
            if (err && err.name === 'AbortError') {
                console.error('[localStore] 用户取消了目录选择');
            } else {
                console.error('[localStore] selectFolder 失败:', err);
            }
            return false;
        });
}

/**
 * 从 IndexedDB 恢复已保存的目录句柄，并请求读写权限
 * @returns {Promise<FileSystemDirectoryHandle|null>} 成功返回句柄，无记录或权限被拒返回 null
 */
export function getStoredFolder() {
    return getHandleFromDB().then(function (handle) {
        if (!handle) {
            return null;
        }

        // 请求读写权限（如果浏览器支持 requestPermission）
        if (typeof handle.requestPermission === 'function') {
            return handle.requestPermission({ mode: 'readwrite' }).then(function (permission) {
                if (permission === 'granted') {
                    return handle;
                }
                console.error('[localStore] 用户拒绝了目录访问权限');
                return null;
            });
        }

        // 不支持权限 API 时直接返回句柄
        return handle;
    }).catch(function (err) {
        console.error('[localStore] getStoredFolder 失败:', err);
        return null;
    });
}

/**
 * 清除 IndexedDB 中保存的目录句柄
 * @returns {Promise<void>}
 */
export function clearStoredFolder() {
    return removeHandleFromDB().catch(function (err) {
        console.error('[localStore] clearStoredFolder 失败:', err);
    });
}

// ======================== 模板文件操作 ========================

/**
 * 遍历目录句柄中的所有条目，收集到 entries 数组
 * @param {FileSystemDirectoryHandle} dirHandle
 * @param {Array} entries 收集结果
 * @returns {Promise<void>}
 */
function iterateEntries(dirHandle, entries) {
    var iterator = dirHandle.entries();

    function next() {
        return iterator.next().then(function (result) {
            if (result.done) {
                return;
            }
            entries.push(result.value);
            return next();
        });
    }

    return next();
}

/**
 * 读取单个文件句柄并解析为 JSON 对象
 * @param {FileSystemFileHandle} fileHandle
 * @returns {Promise<object|null>}
 */
function readAndParseFile(fileHandle) {
    return fileHandle.getFile().then(function (file) {
        return file.text();
    }).then(function (text) {
        try {
            return JSON.parse(text);
        } catch (parseErr) {
            console.error('[localStore] JSON 解析失败 (' + fileHandle.name + '):', parseErr);
            return null;
        }
    }).catch(function (err) {
        console.error('[localStore] 读取文件失败 (' + fileHandle.name + '):', err);
        return null;
    });
}

/**
 * 读取本地文件夹中所有 .json 模板文件
 * 每个模板对象会被附加 source: "local" 标记
 * @returns {Promise<Array<object>>} 模板对象数组，出错时返回空数组
 */
export function readAllLocalTemplates() {
    return getStoredFolder().then(function (handle) {
        if (!handle) {
            return [];
        }

        var templates = [];
        var entries = [];

        // 收集所有目录条目
        return iterateEntries(handle, entries).then(function () {
            // 过滤出 .json 文件
            var jsonFiles = [];
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var name = entry[0];
                var fileHandle = entry[1];
                if (fileHandle.kind === 'file' && name.toLowerCase().endsWith('.json')) {
                    jsonFiles.push(fileHandle);
                }
            }

            if (jsonFiles.length === 0) {
                return [];
            }

            // 依次读取并解析每个 JSON 文件
            var chain = Promise.resolve();
            for (var j = 0; j < jsonFiles.length; j++) {
                (function (fh) {
                    chain = chain.then(function () {
                        return readAndParseFile(fh).then(function (obj) {
                            if (obj && typeof obj === 'object') {
                                obj.source = 'local';
                                templates.push(obj);
                            }
                        });
                    });
                })(jsonFiles[j]);
            }

            return chain.then(function () {
                return templates;
            });
        });
    }).catch(function (err) {
        console.error('[localStore] readAllLocalTemplates 失败:', err);
        return [];
    });
}

/**
 * 将模板对象序列化并写入本地文件夹（创建或覆盖 {name}.json）
 * @param {object} template 模板对象，必须包含 name 字段
 * @returns {Promise<boolean>} 写入成功返回 true，失败返回 false
 */
export function writeTemplateToFolder(template) {
    if (!template || !template.name) {
        console.error('[localStore] writeTemplateToFolder: 模板对象缺少 name 字段');
        return Promise.resolve(false);
    }

    return getStoredFolder().then(function (handle) {
        if (!handle) {
            console.error('[localStore] writeTemplateToFolder: 未获取到目录句柄');
            return false;
        }

        var fileName = template.name + '.json';
        var jsonStr = JSON.stringify(template, null, 2);

        return handle.getFileHandle(fileName, { create: true }).then(function (fileHandle) {
            return fileHandle.createWritable().then(function (writable) {
                return writable.write(jsonStr).then(function () {
                    return writable.close();
                }).then(function () {
                    return true;
                }).catch(function (writeErr) {
                    // 确保 writable 被关闭后再抛出错误
                    return writable.close().then(function () {
                        throw writeErr;
                    }).catch(function () {
                        throw writeErr;
                    });
                });
            });
        });
    }).catch(function (err) {
        console.error('[localStore] writeTemplateToFolder 失败:', err);
        return false;
    });
}

/**
 * 从本地文件夹中删除指定名称的模板文件（{name}.json）
 * @param {string} name 模板名称
 * @returns {Promise<boolean>} 删除成功返回 true，失败返回 false
 */
export function deleteTemplateFromFolder(name) {
    if (!name) {
        console.error('[localStore] deleteTemplateFromFolder: 缺少模板名称');
        return Promise.resolve(false);
    }

    return getStoredFolder().then(function (handle) {
        if (!handle) {
            console.error('[localStore] deleteTemplateFromFolder: 未获取到目录句柄');
            return false;
        }

        var fileName = name + '.json';
        return handle.removeEntry(fileName).then(function () {
            return true;
        });
    }).catch(function (err) {
        console.error('[localStore] deleteTemplateFromFolder 失败 (' + name + '.json):', err);
        return false;
    });
}
