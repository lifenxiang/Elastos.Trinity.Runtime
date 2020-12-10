 /*
  * Copyright (c) 2018 Elastos Foundation
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in all
  * copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  * SOFTWARE.
  */

 import Foundation
 import WebKit

 func resetPath(_ dir: String, _ origin: String) -> String {
    var ret = origin;
    if (!ret.hasPrefix("http://") && !ret.hasPrefix("https://")
            && !ret.hasPrefix("file:///")) {
        while (ret.first == "/") {
            ret.remove(at: ret.startIndex);
        }
        ret = dir + ret;
    }
    return ret;
 }

 func getAbsolutePath(_ path: String, _ type: String? = nil) -> String {
    let nsPath: NSString = path as NSString;
    if !nsPath.isAbsolutePath {
        let absolutePath = Bundle.main.path(forResource: path, ofType: nil)
        if absolutePath != nil {
            return absolutePath!;
        }
    }
    return path;
 }

 func getAssetPath(_ url: String) -> String {
    let index = url.index(url.startIndex, offsetBy: 8)
    let substr = url[index ..< url.endIndex];
    return getAbsolutePath(String(substr));
 }

 func getTrinityPath(_ url: String, _ mainUrl: String) -> String {
    let appManager = AppManager.getShareInstance();
    for (id, view) in appManager.viewControllers {
        if (view.startPage == mainUrl) {
            var offset = 0;
            var path = "";
            if url.hasPrefix("trinity:///asset/") {
                offset = 18;
                path = appManager.getAppPath(view.appInfo!);
            }
            else if url.hasPrefix("trinity:///data/") {
                offset = 16;
                path = appManager.getDataPath(id);
            }
            else if url.hasPrefix("trinity:///temp/") {
                offset = 16;
                path = appManager.getTempPath(id);
            }
            else {
                return ""
            }
            let index = url.index(url.startIndex, offsetBy: offset);
            let substr = url[index ..< url.endIndex];
            return  path + substr;
        }

    }
    return "";
 }

 func handleUrlSchemeTask(_ path: String, _ urlSchemeTask: WKURLSchemeTask) {
    if path.range(of: "://") != nil {
        let request = URLRequest(url: NSURL(string: path)! as URL);
        let session: URLSession = URLSession(configuration: URLSessionConfiguration.default);
        let task = session.dataTask(with: request, completionHandler: {[weak urlSchemeTask] (data, response, error) in
            guard let urlSchemeTask = urlSchemeTask else {
                return
            }

            if let error = error {
                urlSchemeTask.didFailWithError(error)
            } else {
                if let response = response {
                    urlSchemeTask.didReceive(response)
                }

                if let data = data {
                    urlSchemeTask.didReceive(data)
                }
                urlSchemeTask.didFinish()
            }
        })
        task.resume();
    }
    else if path.hasPrefix("/") {
        do {
            let fileUrl = URL.init(fileURLWithPath: path)

            let data = try Data(contentsOf: fileUrl);
            let response = URLResponse(url: urlSchemeTask.request.url!, mimeType: "text/plain", expectedContentLength: data.count, textEncodingName: nil)
            urlSchemeTask.didReceive(response);
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish();
        }
        catch let error {
            print("HandleUrlSchemeTask: \(error)");
        }
    }
 }

 func getJsonFromFile(_ path: String)  throws -> [String: Any] {
    let url = URL.init(fileURLWithPath: path)

    let data = try Data(contentsOf: url);
    let json = try JSONSerialization.jsonObject(with: data,
                                                options: []) as! [String: Any];
    return json;
 }

 enum AppError: Error {
    case error(String)
 }

 func alertDialog(_ title: String, _ msg: String,
                  _ cancel: Bool  = false) {

    func doOKHandler(alerAction:UIAlertAction) {

    }

    func doCancelHandler(alerAction:UIAlertAction) {

    }

    let alertController = UIAlertController(title: title,
                                            message: msg,
                                            preferredStyle: UIAlertController.Style.alert)
    if (cancel) {
        let cancelAlertAction = UIAlertAction(title: "cancel".localized, style:
                                                UIAlertAction.Style.cancel, handler: doCancelHandler)
        alertController.addAction(cancelAlertAction)
    }
    let sureAlertAction = UIAlertAction(title: "ok".localized, style: UIAlertAction.Style.default, handler: doOKHandler)
    alertController.addAction(sureAlertAction)

    DispatchQueue.main.async { AppManager.getShareInstance().mainViewController.presentSafely(alertController, animated: true, presented: {}, completion: nil)
    }
 }

 func getCurrentLanguage() -> String {
    let preferredLang = NSLocale.preferredLanguages.first!

    switch preferredLang {
    case "en-US", "en-CN":
        return "en"
    case "zh-Hans-US","zh-Hans-CN","zh-Hant-CN","zh-TW","zh-HK","zh-Hans":
        return "zh"
    default:
        return "en"
    }
 }

 func getCustomHostname(_ did: String?, _ appId: String) -> String {
    var hostname = "";

    if (did != nil) {
        hostname += did!.replacingOccurrences(of: ":", with: ".");
    }
    hostname += appId;

    return hostname.lowercased().encodingURL();
 }

 func getImageFromURL(_ fileUrl: String) -> UIImage? {
    let url = URL(string: fileUrl)
    let data = try? Data(contentsOf: url!)
    if (data == nil) {
        return nil;
    }
    return UIImage(data: data!)
 }

public func isJSONType(_ str: String) -> Bool {
    let _str = str.trimmingCharacters(in: .whitespacesAndNewlines)
    if (_str.hasPrefix("{") && _str.hasSuffix("}"))
            || (_str.hasPrefix("[") && _str.hasSuffix("]")) {
        return true
    }
    return false
 }

 public func showToastMessage(controller: MainViewController, msg: String) {
     let alert = UIAlertController(title: nil, message: msg, preferredStyle: .alert)
     alert.view.backgroundColor = UIColor.black
     // alert.view.alpha = 0.8
     alert.view.layer.cornerRadius = 15

     // Make sure we run on the UI thread
     DispatchQueue.main.async {
        controller.presentSafely(alert, animated: true, presented: {
            DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + .seconds(2)) {
               alert.dismiss(animated: true)
            }
        })
     }
 }

 public func openUrl(_ urlString: String) {
     let url = URL(string: urlString)!
     if #available(iOS 10, *) {
         UIApplication.shared.open(url, options: [:],
                                     completionHandler: {
                                     (success) in
         })
     }
     else {
         UIApplication.shared.openURL(url);
     }
 }

 public func anyToString(_ value: Any) -> String {
    if (value is String) {
        return (value as! String);
    }
    else if (value is Bool) {
        return (value as! Bool).toString();
    }
    else if (value is [Any]) {
        return (value as! [Any]).description
    }
    else if (value is [String: Any]) {
        return (value as! [String: Any]).toString()!;
    }
    else if (value is Int) {
        return String(value as! Int)
    }
    else if (value is Double) {
        return String(value as! Double)
    }
    else if (value is NSNull) {
        return "null"
    }
    else {
        return "\(value)"
    }
}

public func anyToJsonFieldString(_ value: Any) -> String {
    if (JSONSerialization.isValidJSONObject(value)) {
        do {
            let data = try JSONSerialization.data(withJSONObject: value, options: [])
            return String(data:data, encoding: .utf8)!
        } catch (let e) {
            print(e.localizedDescription)
        }
    }
    return anyToString(value)
}

 //----------------------------------------------------------------------
 // Extend String to be able to throw simple String Errors
 extension String: LocalizedError{

    public var errorDescription: String? { return self }

    func toDict() -> [String : Any]? {
        let data = self.data(using: String.Encoding.utf8)
        if let dict = try? JSONSerialization.jsonObject(with: data!, options: JSONSerialization.ReadingOptions.mutableContainers) as? [String : Any] {
            return dict
        }
        return nil
    }

    func fromBase64() -> String? {
        guard let data = Data(base64Encoded: self, options: Data.Base64DecodingOptions(rawValue: 0)) else {
            return nil
        }

        return String(data: data as Data, encoding: String.Encoding.utf8)
    }

    func toBase64() -> String? {
        guard let data = self.data(using: String.Encoding.utf8) else {
            return nil
        }

        return data.base64EncodedString(options: Data.Base64EncodingOptions(rawValue: 0))
    }

    func toBase64Data() -> Data? {
        var st = self;
        if (self.count % 4 <= 2){
            st += String(repeating: "=", count: (self.count % 4))
        }
        return Data(base64Encoded: st)
    }

    func encodingURL() -> String {
        return self.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed)!
    }

    func encodingQuery() -> String {
        return self.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
    }

    /*
     * Considering that the current string is a string representation of a (invalid but common) JSON object such as:
     * {key:"value"}
     * This methods makes sure to quote all keys are quoted so a further conversion to a dictionary would always succeed.
     */
    func quotedJsonStringKeys() -> String {
        return self.replacingOccurrences(of: "(\\\"(.*?)\\\"|(\\w+))(\\s*:\\s*(\\\".*?\\\"|.))", with: "\"$2$3\"$4", options: .regularExpression)
    }

    func toBool() -> Bool {
        if (self == "true") {
            return true;
        }
        else {
            return false;
        }
    }


    func indexOf(_ sub:String, backwards:Bool = false) -> Int {
        var pos = -1
        if let range = range(of:sub, options: backwards ? .backwards : .literal ) {
            if !range.isEmpty {
                pos = self.distance(from:startIndex, to:range.lowerBound)
            }
        }
        return pos
    }

    func trim() -> String {
        return self.trimmingCharacters(in: CharacterSet.whitespaces)
    }

    func subString(to: Int) -> String {
        var to = to
        if to > self.count {
            to = self.count
        }
        return String(self.prefix(to))
    }

    func subString(from: Int) -> String {
        if from >= self.count {
            return ""
        }
        let startIndex = self.index(self.startIndex, offsetBy: from)
        let endIndex = self.endIndex
        return String(self[startIndex..<endIndex])
    }

    func subString(start: Int, end: Int) -> String {
        if start < end {
            let startIndex = self.index(self.startIndex, offsetBy: start)
            let endIndex = self.index(self.startIndex, offsetBy: end)

            return String(self[startIndex..<endIndex])
        }
        return ""
    }
 }

 extension Bool {
    func toString() -> String {
        return self.description;
    }
 }

 extension Dictionary {
    func percentEncoded() -> Data? {
        return map { key, value in
            let escapedKey = "\(key)".addingPercentEncoding(withAllowedCharacters: .urlQueryValueAllowed) ?? ""
            let escapedValue = "\(value)".addingPercentEncoding(withAllowedCharacters: .urlQueryValueAllowed) ?? ""
            return escapedKey + "=" + escapedValue
        }
        .joined(separator: "&")
        .data(using: .utf8)
    }

    func toString() -> String? {
        let data = try? JSONSerialization.data(withJSONObject: self, options: [])
        if let str = String(data: data!, encoding: String.Encoding.utf8) {
            // JSONSerialization espaces slashes... (bug since many years). ios13 has a fix, but only ios13.
            let fixedString = str.replacingOccurrences(of: "\\/", with: "/")

            return fixedString
        }
        return nil
    }
 }

 extension CharacterSet {
    static let urlQueryValueAllowed: CharacterSet = {
        let generalDelimitersToEncode = ":#[]@" // does not include "?" or "/" due to RFC 3986 - Section 3.4
        let subDelimitersToEncode = "!$&'()*+,;="

        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "\(generalDelimitersToEncode)\(subDelimitersToEncode)")
        return allowed
    }()
 }

 extension URL {
    public var parametersFromQueryString : [String: String]? {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: true),
              let queryItems = components.queryItems else { return nil }
        return queryItems.reduce(into: [String: String]()) { (result, item) in
            result[item.name] = item.value
        }
    }
 }

 extension UIColor {
    /** Html-like #AARRGGBB or #RRGGBB formats */
    public convenience init?(hex: String) {
        let r, g, b, a: CGFloat

        if hex.hasPrefix("#") {
            let start = hex.index(hex.startIndex, offsetBy: 1)
            let hexColor = String(hex[start...])

            if hexColor.count == 8 || hexColor.count == 6 {
                let scanner = Scanner(string: hexColor)
                var hexNumber: UInt64 = 0

                if scanner.scanHexInt64(&hexNumber) {
                    if hexColor.count == 8 {
                        a = CGFloat((hexNumber & 0xff000000) >> 24) / 255
                    }
                    else {
                        a = 255
                    }
                    r = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                    g = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                    b = CGFloat(hexNumber & 0x000000ff) / 255

                    self.init(red: r, green: g, blue: b, alpha: a)
                    return
                }
            }
        }

        print("Failed to initialize color from HEX code \(hex)")
        return nil
    }
 }

 extension UIView {
    func loadViewFromNib() ->UIView {
        let className = type(of:self)
        let bundle = Bundle(for:className)
        let name = NSStringFromClass(className).components(separatedBy: ".").last
        let nib = UINib(nibName: name!, bundle: bundle)
        let view = nib.instantiate(withOwner: self, options: nil).first as! UIView

        return view
    }

    public func addMatchChildConstraints(child: UIView) {
        self.addConstraint(NSLayoutConstraint(item: child, attribute: .top, relatedBy: .equal, toItem: self, attribute: .top, multiplier: 1.0, constant: 0.0))
        self.addConstraint(NSLayoutConstraint(item: child, attribute: .leading, relatedBy: .equal, toItem: self, attribute: .leading, multiplier: 1.0, constant: 0.0))
        self.addConstraint(NSLayoutConstraint(item: child, attribute: .bottom, relatedBy: .equal, toItem: self, attribute: .bottom, multiplier: 1.0, constant: 0.0))
        self.addConstraint(NSLayoutConstraint(item: child, attribute: .trailing, relatedBy: .equal, toItem: self, attribute: .trailing, multiplier: 1.0, constant: 0.0))
        child.translatesAutoresizingMaskIntoConstraints = false
    }
 }


 extension UIImage {
    // grayscale effect on an image. NOTE: modifies the original image data
    var noir: UIImage? {
        let context = CIContext(options: nil)
        guard let currentFilter = CIFilter(name: "CIPhotoEffectNoir") else { return nil }
        currentFilter.setValue(CIImage(image: self), forKey: kCIInputImageKey)
        if let output = currentFilter.outputImage,
           let cgImage = context.createCGImage(output, from: output.extent) {
            return UIImage(cgImage: cgImage, scale: scale, orientation: imageOrientation)
        }
        return nil
    }
 }

 // Add closure usage to gesture recognizers
 extension UIGestureRecognizer {
    typealias Action = ((UIGestureRecognizer) -> ())

    private struct Keys {
        static var actionKey = "ActionKey"
    }

    private var block: Action? {
        set {
            if let newValue = newValue {
                // Computed properties get stored as associated objects
                objc_setAssociatedObject(self, &Keys.actionKey, newValue, objc_AssociationPolicy.OBJC_ASSOCIATION_RETAIN)
            }
        }

        get {
            let action = objc_getAssociatedObject(self, &Keys.actionKey) as? Action
            return action
        }
    }

    @objc func handleAction(recognizer: UIGestureRecognizer) {
        block?(recognizer)
    }

    convenience public  init(block: @escaping ((UIGestureRecognizer) -> ())) {
        self.init()
        self.block = block
        self.addTarget(self, action: #selector(handleAction(recognizer:)))
    }
 }

 public extension FileManager {
    func temporaryFileURL(fileName: String = UUID().uuidString) -> URL? {
        return URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true).appendingPathComponent(fileName)
    }
 }

 /** i18n - strings localization */
 extension String {
    var localized: String {
        if let _ = UserDefaults.standard.string(forKey: "i18n_language") {} else {
            // we set a default, just in case
            UserDefaults.standard.set("en", forKey: "i18n_language")
            UserDefaults.standard.synchronize()
        }

        let lang = UserDefaults.standard.string(forKey: "i18n_language") ?? "en"

        let path = Bundle.main.path(forResource: "Strings/" + lang, ofType: "lproj")
        let bundle = Bundle(path: path!)

        return NSLocalizedString(self, tableName: nil, bundle: bundle!, value: "", comment: "")
    }
 }

 /** 20200611 - Remove scroll bounce effect from all scroll views in the app. NOTE: Works well for dapps, but could have side effect if using scroll view at other location, careful. */
 extension UIScrollView {
    open override func didMoveToWindow() {
        super.didMoveToWindow()
        bounces = false
    }
 }

