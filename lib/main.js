const linksEle = document.getElementById("links");
fetch("./versions.json", {
	cache: "reload"
}).then(response => response.json()).then(e => Object.entries(e).filter(e => e[0] && e[1] && e[1].length).forEach(e => {
	const ele = document.createElement("details");
	ele.id = "links-" + e[0];
	ele.classList.add("linksEle");
	const ele1 = document.createElement("summary");
	const ele2 = document.createElement("h2");
	ele2.innerText = e[0];
	ele2.classList.add("extension-name");
	ele1.insertAdjacentElement("beforeend", ele2);
	ele.insertAdjacentElement("beforeend", ele1);
	const ele3 = document.createElement("ul");
	const rev = e[1].toReversed();
	let verI = 5;
	let lVer = undefined;
	for (let i = 0; i < 7 && i < rev.length; i++) {
		const ver = rev[i].split(".");
		if (lVer !== undefined && (ver[0] !== lVer[0] || ver[1] !== lVer[1])) {
			verI = i;
			break
		}
		lVer = ver
	}
	rev.forEach((version, i) => {
		const liEle = document.createElement("li");
		const aEle = document.createElement("a");
		aEle.href = `extensions/${e[0]}-${version}.vsix`;
		aEle.innerText = `Version ${version}`;
		liEle.insertAdjacentElement("beforeend", aEle);
		ele3.insertAdjacentElement("beforeend", liEle)
	});
	const child = ele3.children[verI];
	if (child) {
		child.insertAdjacentHTML("beforebegin", '<li class="lisum"><details><summary>Historical versions</summary></details></li>')
	}
	ele.insertAdjacentElement("beforeend", ele3);
	linksEle.insertAdjacentElement("beforeend", ele)
}));
