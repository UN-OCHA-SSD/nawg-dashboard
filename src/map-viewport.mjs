// Data/layout updates must not behave like the user's explicit Fit map action.
export function resizePreservingView(map) {
  const center=map.getCenter(),zoom=map.getZoom();
  map.invalidateSize({pan:false,animate:false,debounceMoveend:true});
  map.setView(center,zoom,{animate:false});
}
