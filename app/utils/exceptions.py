from fastapi import HTTPException

class NotFoundError(HTTPException):
    def __init__(self, detail: str = "资源不存在"):
        super().__init__(status_code=404, detail=detail)

class BadRequestError(HTTPException):
    def __init__(self, detail: str = "请求参数错误"):
        super().__init__(status_code=400, detail=detail)

class UnauthorizedError(HTTPException):
    def __init__(self, detail: str = "未登录或登录已过期"):
        super().__init__(status_code=401, detail=detail)
