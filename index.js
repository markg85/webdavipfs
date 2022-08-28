import { v2 as webdav } from '@markg85/webdav-server';
const IPFS_API = process.env.IPFS_API || 'http://127.0.0.1:5001';
const WEBDAV_PORT = process.env.WEBDAV_PORT || 1900;
import VFS from './lib/vfs.js';

const server = new webdav.WebDAVServer({
    port: WEBDAV_PORT
});

(async () => {
    try {
        server.setFileSystemSync("/", new webdav.PhysicalFileSystem(`/`, new VFS('', IPFS_API)));
        server.start(() => console.log(`WebDAV IPFS running on 127.0.0.1:${WEBDAV_PORT}`));
    } catch (error) {
        console.log(error)
        process.exit()
    }
})();
