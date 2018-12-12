var md5 = require('md5')
var request = require('request')
var net = require('net')

const socketConfig = {
    host: '127.0.0.1',
    port: 55533
}

const merchantsConfig = {
    MERCHANTID : '',
    POSID : '',
    BRANCHID : '',
    TXCODE : '530550',
    RETURNTYPE : '2',
    CURCODE : '01',
    PUB : ''
}

module.exports = {

    fillZero:function(val){
        return val < 10 ? '0' + val : val;
    },

    timeJoint:function(){
        var date = new Date();
        var year = date.getFullYear()+'';
        var month = this.fillZore(date.getMonth()+1);
        var day = this.fillZore(date.getDate());
        var hour = this.fillZore(date.getHours());
        var minutes = this.fillZore(date.getMinutes());
        var seconds = this.fillZore(date.getSeconds());

        if(parseInt(minutes) > 60){
            hour++;
            if(parseInt(hour) > 24){
                hour = '00'
            }
            minutes -= 60;
        }

        return year+month+day+hour+minutes+seconds
        

    },
    isExist(val){
        return val ? val : '';
    },
    /**
     * 
     * @param {Object} data - 信息
     *                          {
     *                              MERCHANTID : 商户代码 char(15), - 必填
     *                              POSID : 商户柜台代码 char(9), - 必填
     *                              BRANCHID : 分行代码 char(9), - 必填
     *                              ORDERID : 订单号 char(30), - 必填 --需按以下规则生成订单号：商户代码(15位)+自定义字符串(不超过15位)。字符串可包含数字、字母、下划线。商户需保证订单号唯一。
     *                              PAYMENT : 付款金额 number(16,2), - 必填 -- 缺省为01－人民币（只支持人民币支付）
     *                              CURCODE : 币种 char(2), - 必填
     *                              REMARK1 : 备注 1 char(30), - 可选
     *                              REMARK2 : 备注 2 char(30), - 可选
     *                              TXCODE : 交易码 char(6), - 必填
     *                              RETURNTYPE : 返回类型 char(6), - 可选 --  0或空：返回页面二维码
     *                                                                      1：返回JSON格式【二维码信息串】
     *                                                                      2：返回聚合扫码页面二维码
     *                                                                      3：返回聚合扫码JSON格式【二维码信息串】
     *                                                                      4:返回聚合银联二维
     *                              TIMEOUT : 订单超时时间 char(14), - 可选 -- 格式：YYYYMMDDHHMMSS如：20120214143005
     *                                                                           银行系统时间> TIMEOUT时拒绝交易，若送空值则不判断超时。
     *                              PUB : 商户公钥 char(30),  后30位
     *                              MAC : 校验域 char(32), - 必填 -- 采用标准MD5算法，由商户实现
     *                          }
     */
    postBToCOrderBackPayQR:function(data){//请求支付二维码
        
        //组合params
        let formString = 'MERCHANTID=' + merchantsConfig.MERCHANTID +
                        '&POSID=' + merchantsConfig.POSID +
                        '&BRANCHID=' + merchantsConfig.BRANCHID +
                        '&ORDERID=' + merchantsConfig.MERCHANTID + this.isExist(data.ORDERID) +
                        '&PAYMENT=' + this.isExist(data.PAYMENT) +
                        '&CURCODE=' + merchantsConfig.CURCODE +
                        '&TXCODE=' + merchantsConfig.TXCODE +
                        '&REMARK1=' + escape(this.isExist(data.REMARK1)) +
                        '&REMARK2=' + escape(this.isExist(data.REMARK2)) +
                        '&RETURNTYPE=' + merchantsConfig.RETURNTYPE +
                        '&TIMEOUT=' + this.isExist(this.timeJoint());

        var formData = 'https://ibsbjstar.ccb.com.cn/CCBIS/ccbMain?CCB_IBSVersion=V6&' + formString + '&MAC=' + md5(formString + '&PUB=' + merchantsConfig.PUB);

        return new Promise((resolve, reject) => {
            request({
                url: formData,
                method: 'POST',
                json: true,
                headers:{
                        "content-type": "application/json",
                }
            },function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        resolve(body)
                    }else{
                        reject(error)
                    }
            })
        })

    },
    /**
     * 
     * @param {Object} data - 信息
     *                          {
                                    POSID : 商户柜台代码 char(9),
                                    BRANCHID : 分行代码 char(9),
                                    ORDERID : 订单号 char(30),
                                    PAYMENT : 付款金额 number(16,2),
                                    CURCODE : 币种 char(2),
                                    REMARK1 : 备注 1 char(30), - 可选
                                    REMARK2 : 备注 2 char(30), - 可选
                                    ACC_TYPE : 账户类型 char(2),
                                    SUCCESS : 成功标志 char(1),
                                    TYPE : 接口类型 char(1),
                                    REFERER : Referer信息 char(100),
                                    CLIENTIP : 客户端IP char(40),
                                    ACCDATE : 系统记账日期 char(8),
                                    USRMSG : 支付账户信息 char(100),
                                    USRINFO : 客户加密信息 char(256),
                                    PAYTYPE : 支付方式 char(10),
                                    SIGN : 数字签名 char(256)
     *                          }
     例：verifyPayStatus('POSID=100001329&BRANCHID=500000000&ORDERID=GWA10081217305965959&PAYMENT=0.01&CURCODE=01&REMARK1=&REMARK2=&SUCCESS=Y&TYPE=1&REFERER=http://114.255.7.208/page/bankpay.do&CLIENTIP=114.255.7.194&SIGN=9a7efc7f15f4b0e7f8fba52649d6b97ae33fad44598a7ca1c26196e8ddba00ecf91a596346e4bfd3cc6d2bdba6c085a3cdb0f231d865d7856e37de89846a371c8bc09f8f2643284260499e1d3f464d9ca9d379fe8af3202a09fc83d39f5c68501a4627d62a3ae891d4b0ff6aa21d61f6ba0e9c8bc5840b292af853d2736ce04a')
     */
    verifyPaySign:function(data){//服务端验签
        return new Promise((resolve,reject) => {
            var client = new net.Socket();
            client.connect(socketConfig.port,socketConfig.host,function(){
                client.end(data,()=>{})
            })
        
            client.on('data', function(data){
                //截取字符串第一位，获取验签结果
                var result = data.toString().split("|")[0];
                client.destroy();
                resolve(result == 'Y' ? true : false)
            })
        
            client.on('error',function(error){
                console.log('error:'+error)
                reject(error)
            })
            client.on('close',function(){
                console.log('断开！')
            })
        })
    },
    
}
