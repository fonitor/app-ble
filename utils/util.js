const promisic = function (func) {
    return function (params = {}) {
        return new Promise((resolve, reject) => {
            const args = Object.assign(params, {
                success: (res) => {
                    resolve(res)
                },
                fail: (error) => {
                    reject(error)
                }
            })
            func(args)
        })
    }
}

// 获取系统信息
function getPhoneInfo(callback) {
    wx.getSystemInfo({
        success: function (res) {
            callback(res)
        }
    })
}

export { // 一定要导出啊!~童鞋们,不然找不到的
    promisic,
    getPhoneInfo
}