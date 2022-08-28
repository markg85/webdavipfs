import { Transform } from 'stream';
import got from 'got';

export default class IPFSDownloadStream extends Transform {
  constructor(opts) {
    super(opts)
    this.getStream(opts);
    this.offset = 0;
  }

  getStream(opts) {

    // `${opts.httpApiGatway}/api/v0/cat?arg=${opts.filepath}`
    // `http://127.0.0.1:8080${filepath}`
    // 

    const req = got.stream.get(`http://127.0.0.1:8080${opts.filepath}`, (err, res) => {
      if (err) {
        process.nextTick(() => this.emit('error', err));
        return;
      }

      this.emit('metadata', res);
    });
    req.pipe(this);
  }

  _transform(chunk, encoding, cb) {
    this.offset += chunk.length;
    this.emit('progress', this.offset);
    cb(null, chunk);
  }
}
