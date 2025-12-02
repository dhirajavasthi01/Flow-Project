import { useEffect, useRef, useState } from "react";
import "./MultiSelect.css";

export default function MultiSelectV2({
  data = [],
  onChange,
  activeI = 0,
  initialValues,
  id,
  shouldUpdateSelected = true,
}) {
  const [isActive, setIsActive] = useState(false);
  const [currentActiveTags, setCurrentActiveTags] = useState([
    data[activeI < data?.length && activeI >= 0 ? activeI : 0],
  ]);

  const [isAllSelected, setIsAllSelected] = useState(
    initialValues?.length
      ? false
      : currentActiveTags.findIndex(
          (obj) => obj?.display_name?.toLowerCase() === "all"
        ) >= 0
  );

  /** Reset when data changes */
  useEffect(() => {
    if (shouldUpdateSelected) {
      data = data?.map((obj, i) => ({
        ...obj,
        isSelected: i === 0,
      }));

      const resetActiveTags = [
        data[activeI < data?.length && activeI >= 0 ? activeI : 0],
      ];

      setCurrentActiveTags(resetActiveTags);
      setIsAllSelected(
        resetActiveTags.findIndex(
          (obj) => obj?.display_name?.toLowerCase() === "all"
        ) >= 0
      );
    }
  }, [data]);

  /** Handle initialValues change */
  useEffect(() => {
    if (initialValues?.length) {
      setCurrentActiveTags(initialValues);

      const hasAllValue = initialValues.some(
        (obj) => obj?.display_name?.toLowerCase() === "all"
      );

      if (!hasAllValue) setIsAllSelected(false);
    }
  }, [initialValues]);

  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  document.addEventListener("mousedown", (e) => {
    if (
      !isActive &&
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      !containerRef.current.contains(e.target)
    ) {
      setIsActive(false);
    }
  });

  /** Handles selection */
  function onSelectChange(ev, onChange) {
    let temp_tags = JSON.parse(JSON.stringify(currentActiveTags));

    const allIndex = temp_tags.findIndex(
      (obj) => obj?.display_name?.toLowerCase() === "all"
    );

    if (allIndex >= 0) temp_tags.splice(allIndex, 1);

    const existsIndex = currentActiveTags.findIndex(
      (obj) =>
        obj?.display_name?.toLowerCase() ===
        ev.display_name?.toLowerCase()
    );

    if (existsIndex >= 0) {
      temp_tags = temp_tags.filter((item) => item.tag_name !== ev.tag_name);
    } else {
      temp_tags = [...temp_tags, ev];
    }

    if (ev.display_name?.toLowerCase() === "all") {
      if (isAllSelected) {
        setIsAllSelected(false);
        temp_tags = [];
      } else {
        setIsAllSelected(true);
        temp_tags = [ev];
      }
    } else {
      if (isAllSelected) {
        setIsAllSelected(false);
        temp_tags = [ev];
      } else {
        setIsAllSelected(
          temp_tags.findIndex(
            (obj) => obj?.display_name?.toLowerCase() === "all"
          ) >= 0
        );
      }
    }

    setCurrentActiveTags(temp_tags);
    onChange(temp_tags, ev);
  }

  /** Display selected text */
  function getActiveText(currentActiveTags, data) {
    if (currentActiveTags.length === 0) return "Please Select A Value";

    if (
      currentActiveTags.length === 1 &&
      currentActiveTags[0]?.display_name?.toLowerCase() !== "all"
    )
      return currentActiveTags[0]?.display_name;

    if (
      currentActiveTags.length > 1 &&
      currentActiveTags.length < data?.length &&
      !currentActiveTags.some(
        (obj) => obj?.display_name?.toLowerCase() === "all"
      )
    )
      return "Multiple Selected";

    if (
      data?.length > 1 &&
      currentActiveTags.some(
        (obj) => obj?.display_name?.toLowerCase() === "all"
      )
    )
      return "All";

    if (
      currentActiveTags.length === 1 &&
      data?.length === 1 &&
      currentActiveTags[0].display_name?.toLowerCase() === "all"
    )
      return "-";

    if (
      data?.length === currentActiveTags.length ||
      currentActiveTags.some((obj) =>
        obj?.tag_name?.toLowerCase().includes("all")
      )
    )
      return "All";

    return "-";
  }

  return (
    <div
      id={id}
      ref={containerRef}
      className={`h-full customWidthheckboxDropdown checkboxDropdown ${
        isActive ? "isActive" : ""
      }`}
      onClick={(e) => {
        if (
          isActive &&
          containerRef.current &&
          containerRef.current.contains(e.target)
        ) {
          setIsActive(false);
        } else {
          setIsActive(true);
        }
      }}
    >
      <div className="w-full h-full">
        <div className="flex w-full h-full items-center justify-between">
          <p
            className="text-14 text-sabic_text_regular text-primary_gray uppercase dropPara"
            id="multi-select-click"
          >
            {data?.length > 0
              ? getActiveText(currentActiveTags, data)
              : "-"}
          </p>

          {data?.length > 0 && (
            <p className="ms-1 fa fa-chevron-down rotate_icon"></p>
          )}
        </div>

        {data?.length > 0 && (
          <ul
            ref={dropdownRef}
            className={`checkboxDropdownList globalcheckboxDropdownList ${
              isActive ? "block" : "hidden"
            }`}
            style={{
              height: "auto",
              maxHeight: "14vmin",
              overflow: "auto",
            }}
          >
            {data?.map((val) => (
              <li key={val.tag_name} className="uppercase">
                <label className="munti_select_label items-start">
                  <>
                    <input
                      type="checkbox"
                      className="mr-1 border border-danger none"
                      id={`multi-select-v2-${val.tag_name}`}
                      data-testid={`multi-select-v2-${val.tag_name}`}
                      value={val.tag_name ?? ""}
                      name={val.tag_name}
                      onChange={() => onSelectChange(val, onChange)}
                      checked={
                        isAllSelected
                          ? true
                          : currentActiveTags.findIndex(
                              (obj) =>
                                obj?.display_name?.toLowerCase() ===
                                val.display_name?.toLowerCase()
                            ) >= 0
                      }
                    />

                    <div className="flex justify-between w-full items-start">
                      <span className="dropDownTextMaxWidth">
                        {val.display_name}
                      </span>
                    </div>
                  </>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
