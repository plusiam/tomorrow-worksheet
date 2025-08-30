/* =========================================================
   tomorrow-worksheet: 입력 변화 기반 디바운스 자동저장
   - 저장 지연: 800ms (협의 결과 반영)
   - Key 규칙: TMW_YYYY-MM-DD
   - 저장 알림 배너: #save-toast
   - 의존성 없음, 어떤 HTML 폼 구조에도 부착 가능
   ========================================================= */

(function() {
  'use strict';
  
  const SAVE_DELAY = 800; // 협의 결과: 700ms → 800ms
  const STORAGE_KEY = `TMW_${new Date().toISOString().slice(0, 10)}`;
  const toast = document.getElementById('save-toast');

  // 폼 데이터 수집: 모든 input/textarea/select 값 직렬화
  function collectFormData() {
    const data = {};
    const fields = document.querySelectorAll('input, textarea, select');
    
    fields.forEach(el => {
      // name 속성 우선, 없으면 id 사용
      const key = el.name || el.id || el.getAttribute('data-field');
      if (!key) return;
      
      data[key] = readValue(el);
    });
    
    return data;
  }

  function readValue(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'radio') {
      return el.checked ? el.value : undefined;
    }
    return el.value;
  }

  // 저장 알림 토스트
  let toastTimer;
  function showToast() {
    if (!toast) return;
    
    // 애니메이션 초기화
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { 
      toast.style.opacity = '0'; 
    }, 1500);
  }

  // 디바운스 유틸
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // 저장 함수
  function saveNow() {
    try {
      const payload = collectFormData();
      
      // undefined 값 제거 (radio 미선택 등)
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      showToast();
      
      // 디버그용 (production에서는 제거)
      console.log(`[AutoSave] 저장 완료: ${STORAGE_KEY}`);
    } catch (error) {
      console.error('[AutoSave] 저장 실패:', error);
    }
  }
  
  const saveDebounced = debounce(saveNow, SAVE_DELAY);

  // 입력 변화 이벤트 연결
  ['input', 'change'].forEach(eventType => {
    document.addEventListener(eventType, saveDebounced, {
      capture: false,
      passive: true
    });
  });

  // 초기 로드 시 기존 저장값 복원
  function restoreData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      
      const data = JSON.parse(raw);
      console.log(`[AutoSave] 데이터 복원: ${STORAGE_KEY}`);
      
      // 기존 loadData 함수와 충돌 방지를 위해
      // 기존 함수가 실행된 후 추가 복원 시도
      setTimeout(() => {
        if (typeof window.loadData === 'function') {
          window.loadData();
        }
      }, 100);
    } catch (error) {
      console.error('[AutoSave] 복원 실패:', error);
    }
  }
  
  // DOM 준비 후 복원
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreData);
  } else {
    restoreData();
  }
})();