/**
 * 🔒 입력값 검증 유틸리티
 * XSS, SQL Injection, 길이 제한 등을 검증합니다.
 */

// ✅ 팀 이름 검증
export const validateTeamName = (name: string): { valid: boolean; error?: string } => {
  const maxLength = 100;
  const minLength = 1;
  
  if (!name || typeof name !== 'string') {
    return { valid: false, error: '팀명은 필수입니다.' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return { valid: false, error: `팀명은 ${minLength}-${maxLength}자여야 합니다.` };
  }

  // ✅ 위험한 문자 검사
  if (/<script|<iframe|<img|javascript:|onerror|onclick|on\w+\s*=/gi.test(trimmed)) {
    return { valid: false, error: '허용되지 않는 문자가 포함되었습니다.' };
  }

  return { valid: true };
};

// ✅ URL 검증
export const validateUrl = (
  url: string,
  allowEmpty: boolean = true
): { valid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { valid: allowEmpty, error: allowEmpty ? undefined : 'URL은 필수입니다.' };
  }

  try {
    const urlObj = new URL(url.trim());
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'HTTP 또는 HTTPS URL만 허용됩니다.' };
    }

    if (url.length > 2000) {
      return { valid: false, error: 'URL이 너무 깁니다.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: '올바른 URL 형식이 아닙니다.' };
  }
};

// ✅ 선수 이름 검증
export const validatePlayerName = (name: string): { valid: boolean; error?: string } => {
  const maxLength = 50;
  const minLength = 1;

  if (!name || typeof name !== 'string') {
    return { valid: false, error: '선수 이름은 필수입니다.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return { valid: false, error: `선수 이름은 ${minLength}-${maxLength}자여야 합니다.` };
  }

  if (!/^[a-zA-Z0-9가-힣\s\-()]+$/.test(trimmed)) {
    return { valid: false, error: '선수 이름에 허용되지 않는 문자가 포함되었습니다.' };
  }

  return { valid: true };
};

// ✅ 등번호 검증
export const validateBackNumber = (
  number: number | null | undefined,
  allowNull: boolean = true
): { valid: boolean; error?: string } => {
  if (number === null || number === undefined) {
    return { valid: allowNull, error: allowNull ? undefined : '등번호는 필수입니다.' };
  }

  if (!Number.isInteger(number)) {
    return { valid: false, error: '등번호는 정수여야 합니다.' };
  }

  if (number < 0 || number > 99) {
    return { valid: false, error: '등번호는 0-99 사이여야 합니다.' };
  }

  return { valid: true };
};