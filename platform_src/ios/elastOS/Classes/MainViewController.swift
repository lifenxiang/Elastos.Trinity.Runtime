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

 @nonobjc extension UIViewController {
    func add(_ child: UIViewController) {
        addChild(child)

        child.view.frame = view.frame

        view.addSubview(child.view)
        child.didMove(toParent: self)
    }

    func remove() {
        willMove(toParent: nil)
        view.removeFromSuperview()
        removeFromParent()
    }

    func switchController(from fromViewController: TrinityViewController,
                          to toViewController: TrinityViewController) {
        self.transition(from: fromViewController, to: toViewController, duration: 0, animations: nil);
    }
 }

@objc(MainViewController)
public class MainViewController: UIViewController {
    var appManager: AppManager? = nil
    var passwordManager: PasswordManager? = nil
    var didSessionManager: DIDSessionManager? = nil
    var notificationManager: NotificationManager? = nil

    public override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    convenience init() {
        self.init(nibName: nil, bundle: nil)
    }

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
        appManager = AppManager(self)
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    public override func viewDidLoad() {
        super.viewDidLoad()
    }

    // Called for elastos:// link types
    @objc func openURL(_ url: URL) -> Bool {
        // Handler for elastos://action?params urls.
        let scheme = url.scheme;
        if scheme == nil {
            return false;
        }

        let urlString = url.absoluteString.lowercased();
        let isElastosDomain = IntentManager.checkTrinityScheme(urlString) || IntentManager.isNativeScheme(urlString)

        if scheme!.localizedCaseInsensitiveCompare("elastos") == .orderedSame || isElastosDomain {
            appManager!.setIntentUri(url);
            return true
        }
        else if urlString.hasSuffix(".epk") {
            appManager!.setInstallUri(url.absoluteString, false);
            return true;
        }
        else {
            return false;
        }
    }

    // Called for universal links (applinks:scheme.elastos.org)
    @objc func continueAndRestore(userActivity: NSUserActivity, restorationHandler: @escaping ([Any]?) -> Void) -> Bool {
        if let url = userActivity.webpageURL {
            return openURL(url)
        }
        return true
    }
    
    /**
     * Ensures that 2 controllers are not presented at the same time. All presentations should be done by this method, not directly by present()
     */
    func presentSafely(_ viewControllerToPresent: UIViewController, animated flag: Bool, presented: (() -> Void)? = nil, completion: (() -> Void)? = nil) {
        if self.presentedViewController != nil {
            print("NOTE: Presenting child controller with delay because another controller is already being presented")
            DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(2)) {
                // Wait a bit then present - DIRTY BUT GOOD ENOUGH FOR NOW
                // Retry to SELF, not to parent, to be able to re-delay if needed
                self.presentSafely(viewControllerToPresent, animated: flag, presented: presented, completion: completion)
            }
        }
        else {
            // Present right now
            super.present(viewControllerToPresent, animated: flag, completion: completion)
            presented?()
        }
    }
        
     public override func present(_ viewControllerToPresent: UIViewController, animated flag: Bool, completion: (() -> Void)? = nil) {
        presentSafely(viewControllerToPresent, animated: flag, presented: nil, completion: completion)
     }
}

