import "jquery-ui/ui/core";
import "jquery-ui/ui/widgets/draggable";
import "jquery-ui/ui/widgets/resizable";
import "jquery-ui-rotatable/jquery.ui.rotatable";
import "jquery-ui/themes/base/resizable.css";
import "../css/main.css";

import "./icons";
import main from "./main";

$(document).ready(main);

if (module.hot) {
    module.hot.accept();
}
