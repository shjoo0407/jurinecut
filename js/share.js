// 사진·영상을 휴대폰에 저장한다. 손님 페이지(photo.html)와 부스의 휴대폰 모드가 함께 쓴다.

export const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// 아이폰 공유 시트는 버튼을 누른 직후에 열어야 해서, file은 미리 준비된 File이어야 한다
export async function saveToDevice(file, fallbackUrl) {
  // 아이폰은 공유 시트의 '이미지 저장'·'비디오 저장'이 사진 앱으로 바로 들어간다
  if (isIOS && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  // 그 밖의 휴대폰은 파일로 내려받는다
  const link = document.createElement('a');
  const url = file ? URL.createObjectURL(file) : fallbackUrl;
  link.href = url;
  link.download = file?.name ?? '';
  link.click();
  if (file) setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
