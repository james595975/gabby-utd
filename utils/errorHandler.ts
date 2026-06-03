/**
 * 🔒 안전한 에러 처리
 * 민감한 정보 노출을 방지합니다.
 */

export class SafeError {
  constructor(
    public userMessage: string,
    public internalMessage: string,
    public statusCode: number = 500
  ) {}
}

// ✅ 에러 로깅
export const logError = (
  location: string,
  error: any,
  context?: Record<string, any>
) => {
  const timestamp = new Date().toISOString();
  console.error(
    JSON.stringify(
      {
        timestamp,
        location,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        context,
      },
      null,
      2
    )
  );
};

// ✅ 안전한 에러 메시지
export const getSafeErrorMessage = (error: any): string => {
  if (error instanceof SafeError) {
    return error.userMessage;
  }

  if (error?.message?.includes('UNIQUE violation')) {
    return '이미 존재하는 데이터입니다.';
  }

  if (error?.message?.includes('foreign key')) {
    return '관련 데이터가 없습니다.';
  }

  return '작업 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};