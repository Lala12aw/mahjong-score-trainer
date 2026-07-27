// frame-ancestors は <meta> 経由のCSPでは効かない（HTTPヘッダーが必要）ため、
// 代わりにJSでフレーム内に埋め込まれていないか確認し、埋め込まれていれば
// トップレベルの表示に強制的に切り替える（クリックジャッキング対策）。
if (window.top !== window.self) {
  window.top.location = window.self.location;
}
