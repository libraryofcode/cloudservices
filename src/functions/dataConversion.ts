export default function dataConversion(bytes: number): string {
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  if (bytes === 0) {
    return '0 KB';
  }
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}
