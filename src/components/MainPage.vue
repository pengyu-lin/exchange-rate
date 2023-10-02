<template>
  <div>
    <table class="w-full text-sm text-left text-gray-500">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3">Country</th>
          <th scope="col" class="px-6 py-3">Currency</th>
          <th scope="col" class="px-6 py-3">6480</th>
          <th scope="col" class="px-6 py-3">6480(TWD)</th>
          <th scope="col" class="px-6 py-3">Difference(TWD)</th>
          <th scope="col" class="px-6 py-3">Today</th>
          <th scope="col" class="px-6 py-3">Higest</th>
          <th scope="col" class="px-6 py-3">Lowest</th>
          <th scope="col" class="px-6 py-3">Average</th>
        </tr>
      </thead>
      <tbody>
        <tr class="bg-white border-b">
          <td class="px-6 py-4">Japan</td>
          <td class="px-6 py-4">JPY</td>
          <td class="px-6 py-4">12,000</td>
          <td class="px-6 py-4">{{ currency(inTWD) }}</td>
          <td class="px-6 py-4">{{ currency(calcDifference) }}</td>
          <td class="px-6 py-4">{{ currency(todayJpy) }}</td>
          <td class="px-6 py-4">{{ currency(highest) }}</td>
          <td class="px-6 py-4">{{ currency(lowest) }}</td>
          <td class="px-6 py-4">{{ currency(calcAverage) }}</td>
        </tr>
      </tbody>
    </table>
    <div ref="echart" class="mx-auto" style="width: 800px; height: 500px"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef } from "vue";
import axios from "axios";
import * as echarts from "echarts";
import { currency } from "../utils/currency";
import moment from "moment-timezone";

// get today's data
const latestData = ref();
const todayJpy = ref();
const cstDate = moment.tz("America/Chicago").format("YYYY-MM-DD");

const getLastestData = () => {
  axios
    .get(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${cstDate}/currencies/twd/jpy.json`
    )
    .then((res) => {
      latestData.value = res.data;
      todayJpy.value = res.data.jpy;
    })
    .catch((err) => console.log(err));
};

// get the dates for the past 30 days
const dates = ref([]);
const dataAxis = ref([]);
const getDates = () => {
  const today = moment(cstDate, "YYYY-MM-DD");

  for (let i = 0; i < 30; i++) {
    dates.value.push(today.clone().subtract(i, "days").format("YYYY-MM-DD"));
  }
  dates.value = dates.value.reverse();
  for (let i = 0; i < dates.value.length; i++) {
    dataAxis.value.push(dates.value[i]);
  }
};

// get the data for the past 30 days
const pastData = ref([]);
const allData = ref([]);
const getAllData = async () => {
  try {
    const requests = [];
    for (let i = 0; i < 30; i++) {
      const response = axios.get(
        `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${dates.value[i]}/currencies/twd/jpy.json`
      );
      requests.push(response);
    }
    const responses = await Promise.all(requests);
    pastData.value = responses.map((res) => res.data);
    for (let i = 0; i < pastData.value.length; i++) {
      allData.value.push(pastData.value[i].jpy);
    }
  } catch (error) {
    console.log(error);
  }
};

// calculating the difference after applying exchange rate
const calcDifference = computed(() => {
  if (!latestData.value || !latestData.value.jpy) {
    return null;
  }
  return 3290 - 12000 / latestData.value.jpy;
});

// shows the price in TWD after applying exchange rate
const inTWD = computed(() => {
  if (!latestData.value || !latestData.value.jpy) {
    return null;
  }
  return 12000 / latestData.value.jpy;
});

// calculate the average rate for the past 30 days
const calcAverage = computed(() => {
  const sum = allData.value.reduce((acc, curr) => acc + curr, 0);
  const average = sum / allData.value.length;
  return average;
});

// calculate the highest and lowest for the past 30 days
const highest = computed(() => Math.max(...allData.value));
const lowest = computed(() => Math.min(...allData.value));

//chart related
const chart = shallowRef(null);
const echart = ref(null);
const initChart = () => {
  chart.value = echarts.init(echart.value);
  setOptions();
};
const setOptions = () => {
  chart.value.setOption({
    // title: {
    //   text: "Exchange Rate for the Past 30 Days",
    // },
    xAxis: {
      data: dataAxis.value,
      name: "DATE",
      nameTextStyle: {
        fontWeight: "bold",
        fontSize: "14",
      },
      axisLabel: {
        rotate: 60,
        interval: 3,
      },
    },
    yAxis: {
      min: 4.5,
      max: 4.7,
      type: "value",
      name: "EXCHANGE RATE",
      nameTextStyle: {
        fontWeight: "bold",
        fontSize: "14",
      },
    },
    tooltip: {
      trigger: "axis",
    },
    series: [
      {
        name: "exchange rate",
        type: "line",
        data: allData.value,
      },
    ],
  });
};

onMounted(async () => {
  getLastestData();
  getDates();
  await getAllData();
  initChart();
});
</script>
