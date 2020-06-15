/*
* Copyright (c) 2020 Elastos Foundation
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

import UIKit

class UrlAuthorityAlertController: UIViewController {
    @IBOutlet weak var lblTitle: UILabel!
    @IBOutlet weak var lblSubtitle: UILabel!
    @IBOutlet weak var lblAppNameTitle: UILabel!
    @IBOutlet weak var lblAppName: UILabel!
    @IBOutlet weak var lblUrlTitle: UILabel!
    @IBOutlet weak var lblUrl: UILabel!
    @IBOutlet weak var imgIcon: UIImageView!
    
    @IBOutlet weak var contentBackgorund: UIView!
    @IBOutlet weak var btnDeny: AdvancedButton!
    @IBOutlet weak var btnAccept: AdvancedButton!

    var url: String?
    var appInfo: AppInfo?

    var onAllowClickedListener: (()->Void)?
    var onDenyClickedListener: (()->Void)?

    override func viewDidLoad() {
        super.viewDidLoad()

        // Customize colors
        view.layer.cornerRadius = 20
        view.backgroundColor = UIStyling.popupMainBackgroundColor
        contentBackgorund.backgroundColor = UIStyling.popupSecondaryBackgroundColor
        lblAppNameTitle.textColor = UIStyling.popupMainTextColor
        lblAppName.textColor = UIStyling.popupMainTextColor
        lblUrlTitle.textColor = UIStyling.popupMainTextColor
        lblUrl.textColor = UIStyling.popupMainTextColor
        btnDeny.bgColor = UIStyling.popupSecondaryBackgroundColor
        btnDeny.titleColor = UIStyling.popupMainTextColor
        btnDeny.cornerRadius = 8
        btnAccept.bgColor = UIStyling.popupSecondaryBackgroundColor
        btnAccept.titleColor = UIStyling.popupMainTextColor
        btnAccept.cornerRadius = 8

        // i18n
        lblTitle.text = "url_perm_title".localized
        lblSubtitle.text = "url_perm_subtitle".localized
        lblAppNameTitle.text = "url_perm_capsule".localized
        lblUrlTitle.text = "url_perm_address".localized
        lblUrl.text = url!
        btnDeny.titleString = "api_perm_deny".localized
        btnAccept.titleString = "api_perm_accept".localized

        // Apply data
        lblAppName.text = appInfo!.name
    }

    func setData(url: String, appInfo: AppInfo) {
        self.url = url
        self.appInfo = appInfo
    }

    public func setOnAllowClicked(_ listener: @escaping ()-> Void) {
        self.onAllowClickedListener = listener
    }
    
    public func setOnDenyClicked(_ listener: @escaping ()-> Void) {
        self.onDenyClickedListener = listener
    }

    @IBAction private func denyClicked(_ sender: Any) {
        self.onDenyClickedListener!()
    }

    @IBAction private func allowClicked(_ sender: Any) {
        self.onAllowClickedListener!()
    }
}
