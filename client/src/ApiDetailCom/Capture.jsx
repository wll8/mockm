import React from 'react'
import domtoimage from 'dom-to-image'
import utils from '../utils.jsx'
import * as antd from 'antd'

const {
  blobTool,
} = utils
const {
  useState,
} = React
const {
  Button,
} = antd

function Capture(props) {
  const [state, setState] = useState({ // 默认值
    captureImg: undefined, // 截图 objectUrl
  });

  function capture () {
    if(state.captureImg) {
      setState(preState => ({...preState, captureImg: undefined}))
      props.cb(undefined)
    } else {
      const node = document.querySelector(`.ApiDetail`)
      // const scale = 1200 / node.offsetWidth; // 生成固定宽度的图像
      const scale = 1.5;
      const cfg = {
        height: node.offsetHeight * scale,
        width: node.offsetWidth * scale,
        style: {
          transform: "scale(" + scale + ")",
          transformOrigin: "top left",
          width: node.offsetWidth + "px",
          height: node.offsetHeight + "px",
        }
      }
      domtoimage.toBlob(node, cfg).then(async function (blob) {
        const objectUrl = await blobTool(blob, `toObjectURL`)
        setState(preState => ({...preState, captureImg: objectUrl}))
        props.cb(objectUrl)
        return objectUrl
      }).catch(err => {
        console.log(`err`, err)
      })
    }
  }

  return (
    <Button onClick={capture} size="small" type={state.captureImg ? `primary` : `default`} className="capture">capture</Button>
  )
}

export default Capture
