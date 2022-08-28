'use strict';
import { constants } from 'fs';
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014-2016 Riptide Software Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

    export default class Stats {
        constructor(obj) {

            /* ID of device containing file */
            this.dev = obj.dev;
            /* inode number */
            this.mode = obj.mode;
            /* protection */
            this.nlink = obj.nlink;
            /* number of hard links */
            this.uid = obj.uid;
            /* user ID of owner */
            this.gid = obj.gid;
            /* group ID of owner */
            this.rdev = obj.rdev;
            /* device ID (if special file) */
            this.blksize = obj.blksize;
            /* total size, in bytes */
            this.ino = obj.ino;
            /* blocksize for file system I/O */
            this.size = obj.size;
            /* number of 512B blocks allocated */
            this.blocks = obj.blocks;
            /* time of last access */
            this.atime = new Date(obj.atim_msec);
            /* time of last modification */
            this.mtime = new Date(obj.mtim_msec);
            /* time of last status change */
            this.ctime = new Date(obj.ctim_msec);
            this.birthtime = new Date(obj.birthtim_msec);
        }
        isDirectory() {
            return this.mode == constants.S_IFDIR;
        }
        isFile() {
            return this.mode == constants.S_IFREG;
        }
        isBlockDevice() {
            return false;
        }
        isCharacterDevice() {
            return false;
        }
        isSymbolicLink() {
            return false;
        }
        isFIFO() {
            return false;
        }
        isSocket() {
            return false;
        }

    }



// export default {
//     Stats
// };