import * as path from 'path';
import axios from 'axios';
import IPFSDownloadStream from './ipfs-stream.js';
import { constants } from 'fs';
import Stats from './Stats.js'
import * as crypto from 'crypto'

export default class VFS {
        constructor(rootPath, httpApi) {
            if (!(this instanceof VFS)) {
                return new VFS(rootPath);
            }

            if (typeof rootPath !== 'string') {
                throw new Error('rootPath must be a string');
            }

            if (typeof httpApi !== 'string') {
                throw new Error('httpApi must be a string');
            }

            this.rootPath = rootPath;
            if (this.rootPath && this.rootPath != '') {
                this.rootPath += '/';
            }

            this.httpApi = httpApi;

            this.fdMapping = new Map();
            this.lsCache = new Map();
            this.statCache = new Map();
        }

        /*
            Begin FS Methods
        */
        async stat(statPath, callback) {
            let fullPath = path.join(this.rootPath, statPath);
            fullPath = spacialCaseRewrites(fullPath)
            let parentPath = fullPath.split(path.sep)
            let last = parentPath.pop()
            parentPath = parentPath.join(path.sep)
            let parentSha256 = sha256(parentPath)
            let entry = null;

            // At this point the path must start with either /ipfs/ or /ipns/.
            const fixedPrefixes = ['/ipfs/', '/ipns/']
            if (!fixedPrefixes.some(prefix => fullPath.toLowerCase().startsWith(prefix))) {
                return callback(`Invalid path start. Got path: ${fullPath}`, null)
            }

            if (this.lsCache.has(parentSha256)) {
                let data = this.lsCache.get(parentSha256)
                entry = data.find(obj => obj.Name == last)

                if (entry === undefined) {
                    return callback(`File doesn't exist in this folder. Got path: ${fullPath}`, null)
                }
            }

            // We'll do a stat call if the entry is null. Cache this call.
            if (!entry) {
                let fullUriSha256 = sha256(fullPath)
                if (!this.statCache.has(fullUriSha256)) {
                    let apiCall = `${this.httpApi}/api/v0/files/stat?arg=${fullPath}`;

                    try {
                        let response = await axios.post(apiCall)
                        this.statCache.set(fullUriSha256, response.data)
                        entry = response.data
                    } catch (error) {
                        return callback(`Stat call attempted on non-existent file. Got path: ${fullPath}`, null)
                    }
                } else {
                    entry = this.statCache.get(fullUriSha256)
                }
            }

            return getFileStats(this, entry, fullPath, callback);
        }

        lstat(statPath, callback) {
            return stat(statPath, callback);
        }
        
        readdir(name, callback) {
            let promise = new Promise(async (resolve, reject) => {
                let fullUri = path.join(this.rootPath, name)
                fullUri = spacialCaseRewrites(fullUri)
                let fullUriSha256 = sha256(fullUri)

                if (!this.lsCache.has(fullUriSha256)) {
                    try {
                        let ipfsApiCall = `${this.httpApi}/api/v0/ls?arg=${fullUri}`;
                        let response = await axios.post(ipfsApiCall);
                        let data = response.data.Objects[0].Links
                        this.lsCache.set(fullUriSha256, data)
                    } catch (error) {
                        return reject(error);
                    }
                }

                return resolve(this.lsCache.get(fullUriSha256).map(entry => entry.Name))
            });

            if (!callback) {
                return promise;
            }

            promise.then(function (files) {
                callback(null, files);
            }, function (reason) {
                callback(reason);
            });
        }

        /**
         * The sole purpose of this funbction is to let other libraries "think" they really have a fs object.
         * As the call open on it and then do their read stuff.
         * 
         * All this does is create a mapping of which file was "opened". It essentially is an int -> path mapping.
         */
        open(name, flags, callback) {
            name = spacialCaseRewrites(name)
            let promise = new Promise(async (resolve, reject) => {
                if (flags != 'r') {
                    return reject('Only reading is implemented.');
                }

                if (this.fdMapping.has(name)) {
                    return resolve(this.fdMapping.get(name).fd);
                }

                let fd = this.fdMapping.size + 1;
                this.fdMapping.set(name, { fd: fd, stream: null, name: path.join(this.rootPath, name) });
                return resolve(fd);
            });

            if (!callback) {
                return promise;
            }

            promise.then(function (data) {
                callback(null, data);
            }, function (reason) {
                callback(reason);
            });
        }

        readFile(name, options, callback) {
            let promise = new Promise(async (resolve, reject) => {
                name = spacialCaseRewrites(path.join(this.rootPath, name))
                let ipfsApiCall = `${this.httpApi}/api/v0/cat?arg=${name}`;
                try {
                    let response = await axios.post(ipfsApiCall);
                    if (!options?.encoding) {
                        resolve(response.data);
                    } else {
                        resolve(Buffer.from(response.data, options.encoding));
                    }

                } catch (error) {
                    reject(error);
                }
            });

            if (!callback) {
                return promise;
            }

            promise.then(function (data) {
                callback(null, data);
            }, function (reason) {
                callback(reason);
            });
        }

        createReadStream(name, options) {
            if (name == null && !options?.fd) {
                return null;
            }

            let obj = null;

            // Try open via fd
            if (options?.fd) {
                for (const [key, value] of this.fdMapping) {
                    if (value.fd == options.fd) {
                        obj = value;
                        break;
                    }
                }
            } else {
            }

            if (obj != null) {
                if (obj.stream == null) {
                    obj.stream = new IPFSDownloadStream({ httpApi: this.httpApi, filepath: obj.name });
                }
                return obj.stream;
            }

            return null;
        }

        createWriteStream(name, options) {
            throw new Error('function not implemented');
        }

        realPath(name, options, callback) {
            return callback(`Not implemented`, null)
        }

        mkdir(name, options, callback) {
            return callback(`Not implemented`, null)
        }

        rmdir(name, options, callback) {
            return callback(`Not implemented`, null)
        }

        writeFile(file, data, options, callback) {
            return callback(`Not implemented`, null)
        }

        appendFile(file, data, options, callback) {
            return callback(`Not implemented`, null)
        }

        unlink(name, options) {
            throw new Error('function not implemented');
        }

        exists(name, options) {
            throw new Error('function not implemented');
        }
    }

    /*
     End FS Methods
     */

    /*
     Begin Helper Methods
     */

    function getFileStats(VFS, data, statPath, callback) {
        let promise = new Promise(async (resolve, reject) => {
            try {
                if (data == null) {
                    return reject(`No stat data`)
                }

                if (data.Type == 1 || data.Type == 'directory') {
                    let date = new Date(),
                        stats = new Stats({
                            dev: 0,
                            ino: 0,
                            mode: constants.S_IFDIR,
                            nlink: 1,
                            uid: 0,
                            gid: 0,
                            rdev: 0,
                            size: 0,
                            atim_msec: date,
                            mtim_msec: date,
                            ctim_msec: date,
                            path: statPath
                        });
                    return resolve(stats);
                } else {
                    let date = new Date(),
                        stats = new Stats({
                            dev: 0,
                            ino: 0,
                            mode: constants.S_IFREG,
                            nlink: 1,
                            uid: 0,
                            gid: 0,
                            rdev: 0,
                            size: data.Size,
                            atim_msec: date,
                            mtim_msec: date,
                            ctim_msec: date,
                            path: statPath
                        });
                    return resolve(stats);
                }
            } catch (error) {
                reject(error)
            }
        });

        if (!callback) {
            return promise;
        }

        promise.then(function (stats) {
            callback(null, stats);
        }, function (reason) {
            callback(reason);
        });
    }

    function sha256(input) {
        return crypto.createHash('sha256').update(input).digest('hex');
    }

    function spacialCaseRewrites(inputPath) {
        let newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri"
        let nameLower = inputPath.toLowerCase()

        switch (nameLower) {
            case "/":
                newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri/root/"
                break;
            case "/readme.txt":
                newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri/root/README.txt"
                break;
            case "/ipns":
                newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri/ipns"
                break;
            case "/ipns/readme.txt":
                newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri/ipns/README.txt"
                break;
            case "/ipfs":
                newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri/ipfs"
                break;
            case "/ipfs/readme.txt":
                newPath = "/ipfs/bafybeiabeewjgjarfqtkvztk7iuka3ahvxhxk6s47p3g3ajwqou67a4vri/ipfs/README.txt"
                break;
            default:
                newPath = inputPath
                break;
        }

        return newPath;
    }
