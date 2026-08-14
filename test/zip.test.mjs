import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createZip, crc32 } from '../scripts/zip.mjs';

test('createZip writes a structurally valid store-only archive', () => {
  const entries = [
    { name: 'root/hello.txt', data: Buffer.from('hello world\n', 'utf8') },
    { name: 'root/子目录/数据.bin', data: Buffer.from([0, 1, 2, 3, 4, 250, 251, 252, 253, 254, 255]) },
  ];
  const zip = createZip(entries);

  // Local header of the first entry.
  assert.equal(zip.readUInt32LE(0), 0x04034b50, 'local file signature');
  const nameLen = zip.readUInt16LE(26);
  const dataLen = zip.readUInt32LE(18);
  const name = zip.subarray(30, 30 + nameLen).toString('utf8');
  assert.equal(name, 'root/hello.txt');
  const data = zip.subarray(30 + nameLen, 30 + nameLen + dataLen);
  assert.equal(data.toString('utf8'), 'hello world\n');
  assert.equal(zip.readUInt32LE(14), crc32(Buffer.from('hello world\n', 'utf8')));

  // End of central directory.
  const eocdOffset = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocdOffset), 0x06054b50, 'EOCD signature');
  assert.equal(zip.readUInt16LE(eocdOffset + 8), 2, 'entry count');
  assert.equal(zip.readUInt16LE(eocdOffset + 10), 2, 'central dir entry count');

  // Central directory starts where EOCD says it does.
  const cdOffset = zip.readUInt32LE(eocdOffset + 16);
  assert.equal(zip.readUInt32LE(cdOffset), 0x02014b50, 'central directory signature');
});

test('crc32 matches known vectors', () => {
  assert.equal(crc32(Buffer.from('123456789')).toString(16), 'cbf43926');
  assert.equal(crc32(Buffer.alloc(0)), 0);
});
